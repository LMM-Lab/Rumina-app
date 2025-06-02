import asyncio

from api.modules.transcribers.whisper_transcriber_in_vad import (
    WhisperAudioTranscriber,
)
from api.utils.invalid_transcription import is_invalid_transcription
from api.utils.model_selector import tts_instance
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.openai_chat import get_chat_response

transcriber_instance = WhisperAudioTranscriber(use_vad=True)

router = APIRouter()

MAX_HISTORY = 5
conversation_history = []


@router.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket 接続を受け付けました")

    # 文字起こし処理開始
    await transcriber_instance.start()

    async def receive_audio():
        while True:
            data = await websocket.receive_bytes()
            await transcriber_instance.put_audio_chunk(data)

    async def transcription_to_response_pipeline():
        while True:
            transcription = await transcriber_instance.result_queue.get()

            if is_invalid_transcription(transcription):
                print("⏭️ 無効な文字起こしをスキップ:", transcription)
                continue
            # クライアントへ transcription を送信
            await websocket.send_json(
                {"type": "transcription", "message": transcription}
            )

            history_messages = [
                {"role": "system", "content": "You are a helpful assistant."}
            ]
            history_messages.extend(
                conversation_history[-(MAX_HISTORY * 2) :]
            )  # user/assistantセットで *2
            history_messages.append({"role": "user", "content": transcription})

            # ChatGPT へ問い合わせ（非同期）
            response = await asyncio.to_thread(
                get_chat_response, transcription, history_messages
            )

            # 音声合成処理
            audio_base64 = await asyncio.to_thread(
                tts_instance.synthesize_to_base64, response
            )

            # クライアントへ ChatGPT の応答を送信
            await websocket.send_json(
                {
                    "type": "ai_response",
                    "message": response,
                    "audio_base64": audio_base64,
                }
            )

            # 全体の履歴は常に蓄積されている
            conversation_history.append(
                {"role": "user", "content": transcription}
            )
            conversation_history.append(
                {"role": "assistant", "content": response}
            )

    # 並行タスクとして音声受信と結果送信を実行
    receive_task = asyncio.create_task(receive_audio())
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
