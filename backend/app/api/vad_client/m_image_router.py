import asyncio
import base64
import io
import json
import uuid
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import scipy.io.wavfile as wav
from api.utils.invalid_transcription import is_invalid_transcription
from api.utils.model_selector import (
    get_multimodal_response_func,
    get_transcriber_instance,
    get_tts_instance,
)
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

    init = await ws.receive_json()
    model_name = init.get("model", "rumina-m2")
    vad_silence_ms = init.get("vad_silence_threshold", 1000)
    print(f"📝 model={model_name}  vad={vad_silence_ms}ms")

    # モジュール取得
    transcriber = get_transcriber_instance(model_name)
    await transcriber.start()
    multimodal = get_multimodal_response_func(model_name)
    tts = get_tts_instance(model_name)

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
                        buffer_speech_id = current_speech_id  # ★ save
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
                        await pending_ids.put(buffer_speech_id)  # ★

                # === バイナリ（PCM） ===
                elif "bytes" in msg:
                    audio_buf.extend(msg["bytes"])

            except Exception as e:
                print("recv_loop error:", e)
                break

    # ────── 転写 → LLM/TTS ──────
    async def trans_loop():
        nonlocal current_task, current_speech_id
        while True:
            try:
                text = await transcriber.result_queue.get()
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
                asyncio.create_task(
                    handle_utterance(
                        task, text, transcriber.latest_image_base64, hist
                    )
                )
            except Exception as e:
                print("trans_loop error:", e)
                break

    # ────── 応答生成 & TTS ──────
    async def handle_utterance(
        task: UtteranceTask, user_text: str, img_b64: str | None, hist: list
    ):
        nonlocal current_speech_id

        # LLM
        resp_text = await asyncio.to_thread(
            multimodal, message=user_text, image_base64=img_b64, history=hist
        )

        # キャンセル判定①
        if task.cancel_event.is_set() or task.speech_id != current_speech_id:
            await ws.send_json(
                {
                    "type": "assistant_final",
                    "id": task.id,
                    "message": resp_text,
                    "audio": False,
                }
            )
            return

        # TTS
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
