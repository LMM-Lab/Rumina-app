import asyncio
import uuid

import numpy as np
import scipy.io.wavfile as wav
import torch
import whisper


class WhisperSimpleTranscriber:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model("base", device=device)
        self.result_queue = asyncio.Queue()

        self._silence_trim_duration = 0.0

    async def start(self):
        print("▶️ WhisperSimpleTranscriber ready (no loop needed)")

    async def stop(self):
        print("⛔ WhisperSimpleTranscriber stopped")

    async def transcribe_audio_chunk(self, pcm_chunk: bytes):
        print(
            f"🔸 transcribe_audio_chunk called. Size = {len(pcm_chunk)} bytes"
        )

        # PCM → np.array
        np_chunk = np.frombuffer(pcm_chunk, dtype=np.int16)

        trim_samples = int(self._silence_trim_duration * self.sample_rate)
        if trim_samples > 0:
            if len(np_chunk) > trim_samples:
                print(f"✂️ {trim_samples} サンプル分を末尾から除去")
                np_chunk = np_chunk[:-trim_samples]
            else:
                print("⚠️ カット要求が大きすぎます → 全部カットになるため skip")
                return

        # ✅ ★ ここでローカル WAV 保存（デバッグ用）
        debug_save_path = f"whisper_input_debug_{uuid.uuid4().hex[:8]}.wav"
        wav.write(debug_save_path, self.sample_rate, np_chunk)
        print(f"💾 Whisper に渡す前の音声を保存: {debug_save_path}")

        # Whisper に渡す
        result = self.model.transcribe(
            debug_save_path, language="ja", fp16=torch.cuda.is_available()
        )
        transcription_text = result["text"]

        print("🔡 文字起こし結果:", transcription_text)
        await self.result_queue.put(transcription_text)

    def set_silence_threshold(self, seconds: float):
        print(f"⚙️ silence_duration_threshold を {seconds:.2f} 秒に更新")
        self._silence_trim_duration = seconds

    def update_latest_image(self, image_base64: str):
        self.latest_image_base64 = image_base64
