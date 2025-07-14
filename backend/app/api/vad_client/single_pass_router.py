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

router = APIRouter()

MAX_HISTORY = 5
conversation_history: list[dict] = []


# ───────── データクラス ─────────
@dataclass
class UtteranceTask:
    id: str
    speech_id: int
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


# ───────── ユーティリティ（任意）─────────
def save_debug_wav(pcm: bytes, sr: int = 16_000, prefix="debug"):
    try:
        fname = f"{prefix}_{uuid.uuid4().hex[:8]}.wav"
        wav.write(fname, sr, np.frombuffer(pcm, np.int16))
        print("💾 save", fname)
    except Exception as e:
        print("save_debug_wav error:", e)


# ───────── メイン WS ハンドラ ─────────
@router.websocket("/ws/m/image")
async def we_image_endpoint(ws: WebSocket):
    await ws.accept()
    print("✅ WS accepted")

    session_id = str(uuid.uuid4())
    turn_index = 0

    init = await ws.receive_json()
    model_name = init.get("model", "rumina-m2")
    vad_silence_ms = init.get("vad_silence_threshold", 1000)
    print(f"📝 model={model_name}  vad={vad_silence_ms}ms")

    # モジュール取得
    transcriber = get_transcriber_instance(model_name)
    await transcriber.start()
    vlm = get_response_instance(model_name)
    tts = get_tts_instance(model_name)

    # model 情報をログ出力
    print(f"STT_name: {transcriber.model_name}")
    print(f"TTS_name: {tts.model_name}")
    print(f"VLM_name: {vlm.model_name}")

    # モデル ID を取得
    stt_id = transcriber.model_name
    tts_id = tts.model_name
    vlm_id = vlm.model_name

    # ────── モデルセットの upsert ──────
    # 再現可能な model_set_id を作成
    model_set_id = make_set_id(
        stt_id=stt_id,
        vlm_id=vlm_id,
        tts_id=tts_id,
        filler_id=None,
        set_type="single",
    )

    # DB に upsert（なければ INSERT、あればスキップ）
    pool: Pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
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
            print(f"Model set upserted: {model_set_id}")

    transcriber.set_silence_threshold(max((vad_silence_ms / 1000) - 0.3, 0.05))

    # ────── 状態変数 ──────
    audio_buf = bytearray()
    current_task: Optional[UtteranceTask] = None
    current_speech_id = 0
    buffer_speech_id = 0  # ★ START〜END 間の ID
    pending_ids: asyncio.Queue[int] = asyncio.Queue()

    # ────── 音声と画像受信 ──────
    async def recv_loop():
        nonlocal current_task, current_speech_id, buffer_speech_id
        while True:
            try:
                msg = await ws.receive()

                # === テキスト control ===
                if msg["type"] == "websocket.receive" and "text" in msg:
                    data = json.loads(msg["text"])

                    # --- START ---
                    if data["type"] == "active_audio_start":
                        current_speech_id += 1
                        buffer_speech_id = current_speech_id
                        audio_buf.clear()
                        print("🎙️ START", current_speech_id)

                        if current_task:
                            current_task.cancel_event.set()

                        if img := data.get("image_base64"):
                            transcriber.update_latest_image(img)

                    # --- END ---
                    elif data["type"] == "active_audio_end":
                        print("🛑 END -> transcribe")
                        await transcriber.transcribe_audio_chunk(
                            bytes(audio_buf)
                        )
                        await pending_ids.put(buffer_speech_id)

                # === バイナリ（PCM） ===
                elif "bytes" in msg:
                    audio_buf.extend(msg["bytes"])

            except Exception as e:
                print("recv_loop error:", e)
                break

    # ────── 転写 → LLM/TTS ──────
    async def trans_loop():
        nonlocal current_task, current_speech_id, turn_index
        while True:
            try:
                result = await transcriber.result_queue.get()
                text = result["text"]
                stt_latency = result["latency_ms"]
                print(f"🔡 STT latency: {stt_latency}ms, text={text}")
                speech_id = await pending_ids.get()  # ★ 対応ID取得
                print("📝 text:", text, "sid:", speech_id)

                # 無効 or 空文字スキップ
                if isinstance(text, dict):
                    text = text.get("text", "")
                if is_invalid_transcription(text):
                    continue

                await ws.send_json({"type": "transcription", "message": text})

                # 履歴
                hist = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant.",
                    }
                ]
                hist.extend(conversation_history[-MAX_HISTORY * 2 :])
                hist.append({"role": "user", "content": text})

                # タスク生成
                task = UtteranceTask(
                    id=f"assistant_{uuid.uuid4().hex[:8]}", speech_id=speech_id
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

    # ────── 応答生成 & TTS ──────
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

        # LLM
        vlm_start = asyncio.get_event_loop().time()
        result: GenerationResult = await vlm.generate(
            message=user_text,
            image_base64=img_b64,
            history=hist,
        )
        vlm_latency = int((asyncio.get_event_loop().time() - vlm_start) * 1000)

        vlm_tokens_in = result.prompt_tokens
        vlm_tokens_out = result.completion_tokens

        vlm_tok_per_sec = (
            vlm_tokens_out / (vlm_latency / 1000) if vlm_latency > 0 else None
        )

        resp_text = result.content

        # キャンセル判定①
        if task.cancel_event.is_set() or task.speech_id != current_speech_id:
            await ws.send_json(
                {
                    "type": "assistant_final",
                    "id": task.id,
                    "message": resp_text,
                    "audio": False,
                    "prompt": user_text,
                }
            )
            return

        # TTS
        tts_start = asyncio.get_event_loop().time()
        tts_latency = None
        try:
            audio64 = await asyncio.to_thread(
                tts.synthesize_to_base64, resp_text
            )
        except Exception as e:
            print("TTS failed:", e)
            await ws.send_json(
                {
                    "type": "assistant_final",
                    "id": task.id,
                    "message": resp_text,
                    "audio": False,
                }
            )
            return

        # キャンセル判定②
        if task.cancel_event.is_set() or task.speech_id != current_speech_id:
            await ws.send_json(
                {
                    "type": "assistant_final",
                    "id": task.id,
                    "message": resp_text,
                    "audio": False,
                }
            )
        else:

            tts_latency = int(
                (asyncio.get_event_loop().time() - tts_start) * 1000
            )
            print(f"🎵 TTS latency: {tts_latency}ms")
            await ws.send_json(
                {
                    "type": "ai_response",
                    "id": task.id,
                    "message": resp_text,
                    "audio_base64": audio64,
                }
            )

        # 履歴追加
        conversation_history.append(
            {"role": "assistant", "content": resp_text}
        )
        if len(conversation_history) > MAX_HISTORY * 2:
            conversation_history[:] = conversation_history[-MAX_HISTORY * 2 :]

        # --- 総ターンレイテンシー ---
        if tts_latency is None:
            total_latency = stt_latency + vlm_latency
        else:
            total_latency = stt_latency + vlm_latency + tts_latency

        # ———— DB へログ挿入 ————
        if pool is not None:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO single_turns (
                    request_id,
                    session_id,
                    turn_index,
                    timestamp_utc,
                    model_set_id,

                    stt_latency_ms,
                    transcript,

                    vlm_latency_ms,
                    vlm_tokens_in,
                    vlm_tokens_out,
                    vlm_tok_per_sec,

                    tts_latency_ms,

                    total_turn_latency_ms,
                    net_up_ms,
                    net_down_ms,
                    error_flag
                    ) VALUES (
                    gen_random_uuid()::text,
                    $1, $2, now(), $3,

                    $4, $5,

                    $6, $7, $8, $9,

                    $10,

                    $11, NULL, NULL, NULL
                    )
                    """,
                    # $1…$10 の対応
                    session_id,  # $1
                    turn_index,  # $2
                    model_set_id,  # $3
                    stt_latency,  # $4: stt_latency_ms
                    user_text,  # $5: transcript
                    vlm_latency,  # $6
                    vlm_tokens_in,  # $7: vlm_tokens_in 仮
                    vlm_tokens_out,  # $8: vlm_tokens_out 仮
                    vlm_tok_per_sec,  # $9: vlm_tok_per_sec
                    tts_latency,  # $10: tts_latency_ms
                    total_latency,  # $11: total_turn_latency_ms
                )
        else:
            print("DB pool is None, skipping DB insert.")

    # ────── 走らせる ──────
    recv_task = asyncio.create_task(recv_loop())
    trans_task = asyncio.create_task(trans_loop())

    try:
        await asyncio.gather(recv_task, trans_task)
    except WebSocketDisconnect:
        print("❌ WS disconnected")
    finally:
        recv_task.cancel()
        trans_task.cancel()
        await transcriber.stop()
        print("🛑 session closed")
