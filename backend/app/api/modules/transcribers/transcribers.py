import asyncio
import contextlib
import io
import os
import tempfile
import uuid
import wave
from abc import ABC, abstractmethod

import numpy as np
import openai
import torch
import whisper
from numpy.typing import NDArray


# ---------- 共通基底 ----------
class BaseTranscriber(ABC):
    _model_name: str

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.result_queue: asyncio.Queue[str] = asyncio.Queue()
        self._silence_trim_duration = 0.0
        self.latest_image_base64: str | None = None

    async def start(self):
        print("▶️ Transcriber ready")

    async def stop(self):
        print("⛔ Transcriber stopped")

    @abstractmethod
    async def transcribe_audio_chunk(self, pcm_chunk: bytes): ...

    # 共通ユーティリティ
    def _trim_tail_silence(
        self, np_chunk: NDArray[np.int16]
    ) -> NDArray[np.int16]:
        trim = int(self._silence_trim_duration * self.sample_rate)
        return np_chunk[:-trim] if trim and len(np_chunk) > trim else np_chunk

    def set_silence_threshold(self, sec: float):
        print(f"⚙️ silence_duration_threshold を {sec:.2f} 秒に更新")
        self._silence_trim_duration = sec

    def update_latest_image(self, image_base64: str):
        self.latest_image_base64 = image_base64

    @property
    def model_name(self) -> str:
        return self._model_name


# ---------- ① 既存ローカル Whisper ----------
class WhisperLocalTranscriber(BaseTranscriber):
    def __init__(self, sample_rate: int = 16000, name: str = "base"):
        super().__init__(sample_rate)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model(name, device=device)
        self._model_name = f"whisper_{name}"

    async def transcribe_audio_chunk(self, pcm_chunk: bytes):
        np_chunk = np.frombuffer(pcm_chunk, dtype=np.int16)
        # Save tmp WAV for Whisper
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            wav_path = f.name
            with contextlib.closing(wave.open(f, "wb")) as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(self.sample_rate)
                wf.writeframes(np_chunk.tobytes())

        result = await asyncio.to_thread(
            self.model.transcribe,
            wav_path,
            language="ja",
            fp16=torch.cuda.is_available(),
        )
        transcription_text = str(result["text"])

        print("🔡 文字起こし結果:", transcription_text)
        os.unlink(wav_path)
        await self.result_queue.put(transcription_text)


# ---------- ② OpenAI 一括 STT ----------
class OpenAITranscriber(BaseTranscriber):
    def __init__(
        self,
        sample_rate: int = 16000,
        model: str = "gpt-4o-transcribe",
    ):
        super().__init__(sample_rate)
        self.model = model
        self._model_name = model

    async def transcribe_audio_chunk(self, pcm_chunk: bytes):
        np_chunk = np.frombuffer(pcm_chunk, dtype=np.int16)
        # WAV → in-memory BytesIO (OpenAI wants a "file"-like obj with .name)
        buf = io.BytesIO()
        with contextlib.closing(wave.open(buf, "wb")) as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(np_chunk.tobytes())
        buf.seek(0)
        buf.name = f"audio_{uuid.uuid4().hex[:8]}.wav"

        resp = await asyncio.to_thread(
            openai.audio.transcriptions.create,
            file=buf,
            model=self.model_name,
        )
        transcription_text = resp.text
        print("🔡 文字起こし結果(OpenAI):", transcription_text)
        await self.result_queue.put(transcription_text)


# ---------- ③ ヘルパ ----------
def get_transcriber_instance(model_name: str):
    if model_name.endswith("-pro"):
        return OpenAITranscriber()
    return WhisperLocalTranscriber()
