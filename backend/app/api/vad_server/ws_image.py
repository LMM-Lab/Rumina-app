import asyncio
import base64
from pathlib import Path

from api.modules.transcribers.whisper_transcriber_in_vad import (
    WhisperAudioTranscriber,
)
from api.utils.invalid_transcription import is_invalid_transcription
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.openai_chat import get_multimodal_response
from services.tts_generator import TTSGenerator

tts_instance = TTSGenerator()
transcriber_instance = WhisperAudioTranscriber(use_vad=True)
router = APIRouter()

MAX_HISTORY = 5
conversation_history = []


@router.websocket("/ws/image")
async def we_image_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket 接続を受け付けました")

    # 文字起こし処理開始
    await transcriber_instance.start()

    def save_base64_image(image_base64: str, path: str = "received_image.png"):
        # "data:image/png;base64,..." の形式ならカンマ以降だけ抽出
        if image_base64.startswith("data:image"):
            image_base64 = image_base64.split(",")[1]
        try:
            image_data = base64.b64decode(image_base64)
            Path(path).write_bytes(image_data)
            print(f"💾 画像を保存しました: {path}")
        except Exception as e:
            print("⚠️ 画像の保存に失敗しました:", e)

    async def receive_audio_and_image():
        while True:
            data = await websocket.receive_json()
            if data["type"] == "audio_chunk":
                # 音声チャンクを送信
                await transcriber_instance.put_audio_chunk(
                    bytes.fromhex(data["audio_hex"])
                )
            elif data["type"] == "image":
                # 画像データの更新
                transcriber_instance.update_latest_image(data["image_base64"])

    async def transcription_to_response_pipeline():
        while True:
            bundle = await transcriber_instance.result_bundle_queue.get()
            transcription = bundle["text"]
            image_base64 = bundle["image"]

            if is_invalid_transcription(transcription):
                print("⏭️ 無効な文字起こしをスキップ：", transcription)
                continue
            # クライアントへ transcription を送信
            await websocket.send_json(
                {"type": "transcription", "message": transcription}
            )

            history_messages = [
                {"role": "system", "content": "You are a helpful assustant."}
            ]
            # 過去の会話履歴の一部を追加
            history_messages.extend(conversation_history[-(MAX_HISTORY * 2) :])

            # ユーザーの指示を追加
            history_messages.append({"role": "user", "contect": transcription})

            # ChatGPTへ問い合わせ（非同期）
            # TODO: ここの処理で画像を含めて処理するための関数を用意する必要がある
            response = await asyncio.to_thread(
                get_multimodal_response,
                message=transcription,
                image_base64=image_base64,
                history=history_messages,
            )

            # 音声合成処理
            audio_base64 = await asyncio.to_thread(
                tts_instance.synthesize_to_base64, response
            )

            # クライアントへ 応答を送信
            await websocket.send_json(
                {
                    "type": "ai_response",
                    "message": response,
                    "audio_base64": audio_base64,
                }
            )

            # 会話履歴に追加
            conversation_history.append(
                {"role": "user", "content": transcription}
            )
            conversation_history.append(
                {"role": "assistant", "content": response}
            )

    # 並行タスクとして非同期で音声受信と結果作成および送信を実行
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
