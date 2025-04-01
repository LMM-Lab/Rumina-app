from api.websocket import router as websocket_router
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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
