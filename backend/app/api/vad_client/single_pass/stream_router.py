import asyncio
import json
import uuid
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import scipy.io.wavfile as wav
from api.modules.response_generation.vlm.types import GenerationResult
from api.utils.invalid_transcription import is_invalid_transcription
from api.utils.model_selector import (
    get_response_instance,
    get_transcriber_instance,
    get_tts_instance,
)
from api.utils.model_set import make_set_id
from asyncpg import Pool
from db.session import get_pool
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

"""Streaming‑first WebSocket router (single‑pass architecture)

Endpoint: /ws/m/image-stream

Behaviour:
    • Streams VLM tokens → sentence buffering (「。」, "!", "?" 等)
    • Emits each sentence to the client as soon as it closes.
    • Kicks off an async TTS worker per sentence; sends audio when ready.
    • Supports user interruption by speech‑id or explicit stop message.

This file lives under routers/single_pass so that Track (single/dual) × I/O (sync/stream)
are orthogonal and discoverable.
"""

router = APIRouter()

MAX_HISTORY = 5
conversation_history: list[dict] = []


# ───────── Data classes ───────── #
@dataclass
class UtteranceTask:
    id: str
    speech_id: int
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


# ───────── Helpers ───────── #
SEPS = ("。", "！", "？", ".", "!", "?")


def save_debug_wav(pcm: bytes, sr: int = 16_000, prefix="debug"):
    """Dump raw PCM to disk for debugging (optional)."""
    try:
        fname = f"{prefix}_{uuid.uuid4().hex[:8]}.wav"
        wav.write(fname, sr, np.frombuffer(pcm, np.int16))
        print("💾 save", fname)
    except Exception as e:
        print("save_debug_wav error:", e)


# ───────── Main WS handler ───────── #
@router.websocket("/ws/m/image-stream")
async def ws_image_stream(ws: WebSocket):
    await ws.accept()
    print("✅ WS(stream) accepted")

    session_id = str(uuid.uuid4())
    turn_index = 0

    init = await ws.receive_json()
    model_name = init.get("model", "rumina-m2")
    vad_silence_ms = init.get("vad_silence_threshold", 1000)
    print(f"📝 model={model_name}  vad={vad_silence_ms}ms (stream mode)")

    # Modules
    transcriber = get_transcriber_instance(model_name)
    await transcriber.start()
    vlm = get_response_instance(model_name)
    tts = get_tts_instance(model_name)

    # IDs
    stt_id = transcriber.model_name
    tts_id = tts.model_name
    vlm_id = vlm.model_name

    model_set_id = make_set_id(
        stt_id=stt_id,
        vlm_id=vlm_id,
        tts_id=tts_id,
        filler_id=None,
        set_type="single",
    )

    # Upsert model_set
    pool: Pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO model_set_catalog (set_id, set_type, stt_id, vlm_id, tts_id)
            VALUES ($1, 'single', $2, $3, $4)
            ON CONFLICT (set_id) DO NOTHING
            """,
            model_set_id,
            stt_id,
            vlm_id,
            tts_id,
        )

    # Silence threshold
    transcriber.set_silence_threshold(max((vad_silence_ms / 1000) - 0.3, 0.05))

    # ────── State vars ──────
    audio_buf = bytearray()
    current_task: Optional[UtteranceTask] = None
    current_speech_id = 0
    buffer_speech_id = 0
    pending_ids: asyncio.Queue[int] = asyncio.Queue()

    ###############################
    # Receive Loop                #
    ###############################
    async def recv_loop():
        nonlocal current_task, current_speech_id, buffer_speech_id
        while True:
            try:
                msg = await ws.receive()

                # Control frames (JSON)
                if msg["type"] == "websocket.receive" and "text" in msg:
                    data = json.loads(msg["text"])

                    if data["type"] == "active_audio_start":
                        current_speech_id += 1
                        buffer_speech_id = current_speech_id
                        audio_buf.clear()
                        print("🎙️ START", current_speech_id)

                        if current_task:
                            current_task.cancel_event.set()

                        if img := data.get("image_base64"):
                            transcriber.update_latest_image(img)

                    elif data["type"] == "active_audio_end":
                        print("🛑 END -> transcribe (stream)")
                        await transcriber.transcribe_audio_chunk(
                            bytes(audio_buf)
                        )
                        await pending_ids.put(buffer_speech_id)

                    elif data["type"] == "stop_generation" and current_task:
                        current_task.cancel_event.set()

                # PCM
                elif "bytes" in msg:
                    audio_buf.extend(msg["bytes"])

            except Exception as e:
                print("recv_loop error:", e)
                break

    ###############################
    # Transcription → VLM         #
    ###############################
    async def trans_loop():
        nonlocal current_task, current_speech_id, turn_index
        while True:
            try:
                result = await transcriber.result_queue.get()
                text = result["text"]
                stt_latency = result["latency_ms"]
                speech_id = await pending_ids.get()
                print(
                    f"🔡 STT latency={stt_latency}ms text={text} (sid={speech_id})"
                )

                if isinstance(text, dict):
                    text = text.get("text", "")
                if is_invalid_transcription(text):
                    continue

                await ws.send_json({"type": "transcription", "message": text})

                # Build history
                hist = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant.",
                    }
                ]
                hist.extend(conversation_history[-MAX_HISTORY * 2 :])
                hist.append({"role": "user", "content": text})

                task = UtteranceTask(
                    id=f"assistant_{uuid.uuid4().hex[:8]}",
                    speech_id=speech_id,
                )
                current_task = task
                turn_index += 1

                asyncio.create_task(
                    handle_utterance(
                        task,
                        text,
                        transcriber.latest_image_base64,
                        hist,
                        session_id,
                        turn_index,
                        model_set_id,
                        pool,
                        stt_latency,
                    )
                )
            except Exception as e:
                print("trans_loop error:", e)
                break

    ###############################
    # Handle Utterance (stream)   #
    ###############################
    async def handle_utterance(
        task: UtteranceTask,
        user_text: str,
        img_b64: str | None,
        hist: list,
        session_id: str,
        turn_index: int,
        model_set_id: str,
        pool: Optional[Pool],
        stt_latency: int,
    ):
        nonlocal current_speech_id

        sentence_buf: str = ""
        seq = 0
        vlm_tokens_in = vlm_tokens_out = vlm_tok_per_sec = None

        vlm_start = asyncio.get_event_loop().time()
        try:
            async for token in vlm.stream_generate(
                message=user_text,
                image_base64=img_b64,
                history=hist,
            ):
                # First token → prompt/completion counts available
                if vlm_tokens_in is None:
                    if isinstance(token, GenerationResult):
                        # Some impl may yield meta first
                        vlm_tokens_in = token.prompt_tokens
                        vlm_tokens_out = 0  # will accumulate
                        continue

                # Cancellation check (per‑token granularity)
                if (
                    task.cancel_event.is_set()
                    or task.speech_id != current_speech_id
                ):
                    print("✂️ generation cancelled")
                    break

                # Accumulate
                sentence_buf += token
                vlm_tokens_out = (vlm_tokens_out or 0) + 1

                # Sentence boundary?
                if token in SEPS:
                    await emit_sentence(task, seq, sentence_buf)
                    asyncio.create_task(tts_worker(task, seq, sentence_buf))
                    sentence_buf = ""
                    seq += 1

            # flush remainder
            if sentence_buf:
                await emit_sentence(task, seq, sentence_buf)
                asyncio.create_task(tts_worker(task, seq, sentence_buf))
                seq += 1

        except Exception as e:
            print("VLM stream error:", e)

        vlm_latency = int((asyncio.get_event_loop().time() - vlm_start) * 1000)
        if vlm_tokens_out and vlm_latency:
            vlm_tok_per_sec = vlm_tokens_out / (vlm_latency / 1000)

        await ws.send_json({"type": "assistant_done", "id": task.id})

        # History append (full text)
        conversation_history.append(
            {"role": "assistant", "content": ""}
        )  # placeholder
        if len(conversation_history) > MAX_HISTORY * 2:
            conversation_history[:] = conversation_history[-MAX_HISTORY * 2 :]

        # # DB logging (latency only; tokens optional)
        # if pool is not None:
        #     async with pool.acquire() as conn:
        #         await conn.execute(
        #             """
        #             INSERT INTO single_turns (
        #             request_id, session_id, turn_index, timestamp_utc, model_set_id,
        #             stt_latency_ms, transcript,
        #             vlm_latency_ms, vlm_tokens_in, vlm_tokens_out, vlm_tok_per_sec,
        #             tts_latency_ms,
        #             total_turn_latency_ms, net_up_ms, net_down_ms, error_flag
        #             ) VALUES (
        #             gen_random_uuid()::text,
        #             $1, $2, now(), $3,
        #             $4, $5,
        #             $6, $7, $8, $9,
        #             NULL,
        #             NULL, NULL, NULL, NULL
        #             )
        #             """,
        #             session_id,
        #             turn_index,
        #             model_set_id,
        #             stt_latency,
        #             user_text,
        #             vlm_latency,
        #             vlm_tokens_in,
        #             vlm_tokens_out,
        #             vlm_tok_per_sec,
        #         )

    ###############################
    # Emit helpers                #
    ###############################
    async def emit_sentence(task: UtteranceTask, seq: int, text: str):
        payload = {
            "type": "assistant_chunk",
            "id": task.id,
            "seq": seq,
            "message": text,
        }
        await ws.send_json(payload)

    async def tts_worker(task: UtteranceTask, seq: int, text: str):
        if task.cancel_event.is_set():
            return
        try:
            audio64 = await asyncio.to_thread(tts.synthesize_to_base64, text)
            await ws.send_json(
                {
                    "type": "assistant_audio_chunk",
                    "id": task.id,
                    "seq": seq,
                    "audio_base64": audio64,
                }
            )
        except Exception as e:
            print("TTS chunk failed:", e)

    ###############################
    # Run loops                   #
    ###############################
    recv_task = asyncio.create_task(recv_loop())
    trans_task = asyncio.create_task(trans_loop())

    try:
        await asyncio.gather(recv_task, trans_task)
    except WebSocketDisconnect:
        print("❌ WS(stream) disconnected")
    finally:
        recv_task.cancel()
        trans_task.cancel()
        await transcriber.stop()
        print("🛑 stream session closed")
