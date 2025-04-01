import asyncio

from api.websocket_transcription import transcriber_instance
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


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

    async def send_transcriptions():
        while True:
            transcription = await transcriber_instance.result_queue.get()
            await websocket.send_text(transcription)

    # 並行タスクとして音声受信と結果送信を実行
    receive_task = asyncio.create_task(receive_audio())
    send_task = asyncio.create_task(send_transcriptions())

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
