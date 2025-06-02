import asyncio
import base64
import json
import uuid
from pathlib import Path

import numpy as np
import scipy.io.wavfile as wav
import scipy.io.wavfile as wavfile
from api.utils.invalid_transcription import is_invalid_transcription
from api.utils.model_selector import (
    get_multimodal_response_func,
    get_transcriber_instance,
    get_tts_instance,
)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

MAX_HISTORY = 5
conversation_history = []


def save_debug_wav(
    pcm_bytes: bytes, sample_rate: int = 16000, prefix: str = "debug_audio"
):
    """デバッグ用に PCM データを WAV ファイルとして保存"""
    try:
        save_path = f"{prefix}_{uuid.uuid4().hex[:8]}.wav"
        audio_np = np.frombuffer(pcm_bytes, dtype=np.int16)
        wav.write(save_path, sample_rate, audio_np)
        print(f"💾 デバッグ音声を保存しました: {save_path}")
    except Exception as e:
        print(f"⚠️ save_debug_wav エラー: {e}")


@router.websocket("/ws/m/image")
async def we_image_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket 接続を受け付けました")

    # STEP 1️⃣ モデル名を最初に受け取る
    init_data = await websocket.receive_json()
    model_name = init_data.get("model", "rumina-m2")
    print(f"📝 モデル名を受け取りました: {model_name}")
    vad_silence_threshold_ms = init_data.get("vad_silence_threshold", 1000)
    print(f"✅ VAD silence threshold {vad_silence_threshold_ms} ms")

    # STEP 2️⃣ モデルに応じたインスタンス選択
    transcriber_instance = get_transcriber_instance(model_name)
    print("now")
    # 文字起こし処理開始
    await transcriber_instance.start()
    multimodal_response_func = get_multimodal_response_func(model_name)
    m_tts_instance = get_tts_instance(model_name)

    transcriber_instance.set_silence_threshold(
        (vad_silence_threshold_ms / 1000.0) - 0.3  # 余裕を持たせる
    )

    # ★ 音声バッファ
    audio_buffer = bytearray()

    async def receive_audio_and_image():
        while True:
            try:
                message = await websocket.receive()

                if message["type"] == "websocket.receive":
                    if "text" in message:
                        data = message["text"]
                        # print(f"🟢 受信 JSON データ: {data}")
                        data_json = json.loads(data)

                        if data_json["type"] == "active_audio_start":
                            print("🎙️ START")
                            audio_buffer.clear()

                            image_base64 = data_json.get("image_base64")
                            if image_base64:
                                print("🖼️ 画像データ受信 → 更新")
                                transcriber_instance.update_latest_image(
                                    image_base64
                                )
                            else:
                                print("⚠️ image_base64 が含まれていません")

                        elif data_json["type"] == "active_audio_end":
                            print("🛑 END, processing audio")
                            # save_debug_wav(
                            #     bytes(audio_buffer), prefix="debug_end"
                            # )
                            # print(
                            #     f"📤 audio_buffer size = {len(audio_buffer)} bytes"
                            # )

                            # ここでのみ transcribe_audio_chunk 呼ぶ
                            await transcriber_instance.transcribe_audio_chunk(
                                bytes(audio_buffer)
                            )
                            print(f"✅ transcribe_audio_chunk 呼び出し完了")

                    elif "bytes" in message:
                        pcm_bytes = message["bytes"]
                        # print(f"🎵 Received {len(pcm_bytes)} bytes (binary)")
                        audio_buffer.extend(pcm_bytes)
                        # print(
                        #     f"🔄 audio_buffer size = {len(audio_buffer)} bytes"
                        # )

                        # ✅ デバッグ用保存 (Optional)
                        # if (
                        #     len(audio_buffer) >= 1024
                        #     and len(audio_buffer) % 1024 == 0
                        # ):
                        # save_debug_wav(
                        #     bytes(audio_buffer), prefix="debug_chunk"
                        # )
                        # print(
                        #     f"💾 一時デバッグ保存 (size: {len(audio_buffer)} bytes)"
                        # )

            except Exception as e:
                print(f"🚨 receive_audio_and_image エラー: {e}")
                break

    async def transcription_to_response_pipeline():
        while True:
            try:
                # WhisperSimpleTranscriber に対応
                transcription = await transcriber_instance.result_queue.get()
                print(
                    f"📝 result_queue.get() → {type(transcription)}, 内容: {transcription}"
                )

                # transcription が dict なら text を取り出す、str ならそのまま使う
                if isinstance(transcription, dict):
                    transcribed_text = transcription.get("text", "")
                elif isinstance(transcription, str):
                    transcribed_text = transcription
                else:
                    transcribed_text = ""
                    print(
                        f"⚠️ transcription の想定外の型: {type(transcription)} → 内容: {transcription}"
                    )

                # 無効チェック
                if is_invalid_transcription(transcribed_text):
                    print("⏭️ 無効な文字起こしをスキップ：", transcribed_text)
                    continue

                # transcription 送信
                await websocket.send_json(
                    {"type": "transcription", "message": transcribed_text}
                )

                # 履歴構築
                history_messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant.",
                    }
                ]
                history_messages.extend(
                    conversation_history[-(MAX_HISTORY * 2) :]
                )
                history_messages.append(
                    {"role": "user", "content": transcribed_text}
                )

                latest_image_base64 = transcriber_instance.latest_image_base64

                # モデルに問い合わせ
                response = await asyncio.to_thread(
                    multimodal_response_func,
                    message=transcribed_text,
                    image_base64=latest_image_base64,
                    history=history_messages,
                )

                # # TTS → base64音声
                audio_base64 = await asyncio.to_thread(
                    m_tts_instance.synthesize_to_base64, response
                )

                # 応答送信
                await websocket.send_json(
                    {
                        "type": "ai_response",
                        "message": response,
                        "audio_base64": audio_base64,
                    }
                )

                # 履歴追加
                conversation_history.append(
                    {"role": "user", "content": transcribed_text}
                )
                conversation_history.append(
                    {"role": "assistant", "content": response}
                )

            except Exception as e:
                print(f"🚨 transcription_to_response_pipeline エラー: {e}")
                break

    # 並行タスク起動
    receive_task = asyncio.create_task(receive_audio_and_image())
    send_task = asyncio.create_task(transcription_to_response_pipeline())

    try:
        await asyncio.gather(receive_task, send_task)
    except WebSocketDisconnect as e:
        print("❌ WebSocket 接続が切断されました。コード:", e.code)
    except Exception as e:
        print("🚨 想定外のエラー:", e)
    finally:
        receive_task.cancel()
        send_task.cancel()
        await transcriber_instance.stop()
        print("🛑 録音セッション終了")
