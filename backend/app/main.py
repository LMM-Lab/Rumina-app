from api.vad_client.m_image_router import router as m_image_router
from api.vad_server.ws_audio import router as websocket_router
from api.vad_server.ws_image import router as image_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORSミドルウェア
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 必要に応じて制限
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Rumina Backend is running"}


# WebSocketルートの登録
app.include_router(websocket_router)
app.include_router(image_router)
app.include_router(m_image_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
