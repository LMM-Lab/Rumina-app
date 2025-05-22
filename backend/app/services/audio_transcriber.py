import asyncio
import re
import time
from collections import Counter
from tempfile import NamedTemporaryFile

import numpy as np
import torch
import scipy.io.wavfile as wav
import webrtcvad
import whisper
from numpy.typing import NDArray


class WhisperAudioTranscriber:
    def __init__(self, sample_rate: int = 16000, use_vad: bool = True):
        self.sample_rate = sample_rate
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model("base", device=device)
        # 非同期処理用の asyncio.Queue を使用
        self.audio_queue = asyncio.Queue()
        # 文字起こし結果をクライアントに送信するためのキュー
        self.result_queue = asyncio.Queue()
        self.use_vad = use_vad

        # RMS 判定用パラメータ
        self.silence_rms_threshold = 0.01
        self.silence_duration_threshold = 0.3

        # VAD 判定用インスタンス（モード 2: 中程度の厳しさ）
        self.vad = webrtcvad.Vad(2)
        self.frame_duration_ms = 30  # 30ms
        self.frame_size = int(sample_rate * self.frame_duration_ms / 1000)

        self._running = False
        self._task: asyncio.Task[None] | None = None

        self.latest_image_base64 = None
        self.result_bundle_queue = asyncio.Queue()

    def compute_rms(self, data: NDArray[np.float32]) -> float:
        return np.sqrt(np.mean(np.square(data)))

    def is_speech_vad(self, pcm_chunk: NDArray[np.int16]) -> bool:
        if pcm_chunk.dtype != np.int16:
            pcm_chunk = (pcm_chunk * 32767).astype(np.int16)
        pcm_bytes = pcm_chunk.tobytes()
        try:
            return self.vad.is_speech(pcm_bytes, sample_rate=self.sample_rate)
        except Exception as e:
            print(f"VADエラー: {e}")
            return False

    async def put_audio_chunk(self, chunk: bytes):
        np_chunk = (
            np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768.0
        )
        await self.audio_queue.put(np_chunk)

    def update_latest_image(self, image_base64: str):
        self.latest_image_base64 = image_base64

    async def start(self):
        if not self._running:
            print("▶️ Improved transcription loop を開始")
            self._running = True
            self._task = asyncio.create_task(self.transcription_loop())

    async def stop(self):
        print("⛔ Improved transcription loop を停止")
        self._running = False
        if self._task:
            await self._task
            self._task = None

    async def transcription_loop(self):
        print("✨ Improved Whisper文字起こしループ起動")
        while self._running:
            audio_data = []
            silence_start = None
            image_at_trigger = None

            try:
                first_chunk = await asyncio.wait_for(
                    self.audio_queue.get(), timeout=0.5
                )
            except asyncio.TimeoutError:
                continue

            # 初回チャンクが発話か否かで録音開始の判断
            if self.use_vad:
                is_speech = self.is_speech_vad(first_chunk[: self.frame_size])
            else:
                is_speech = (
                    self.compute_rms(first_chunk) > self.silence_rms_threshold
                )

            if not is_speech:
                continue

            print("🎤 音声検出、録音開始")
            audio_data.append(first_chunk)
            image_at_trigger = self.latest_image_base64

            while self._running:
                try:
                    chunk = await asyncio.wait_for(
                        self.audio_queue.get(), timeout=0.1
                    )
                except asyncio.TimeoutError:
                    if (
                        silence_start
                        and time.time() - silence_start
                        > self.silence_duration_threshold
                    ):
                        print("📴 タイムアウトで録音終了")
                        break
                    continue

                if self.use_vad:
                    is_speech = self.is_speech_vad(chunk[: self.frame_size])
                else:
                    is_speech = (
                        self.compute_rms(chunk) > self.silence_rms_threshold
                    )

                if is_speech:
                    audio_data.append(chunk)
                    silence_start = None
                else:
                    if silence_start is None:
                        silence_start = time.time()
                    elif (
                        time.time() - silence_start
                        > self.silence_duration_threshold
                    ):
                        print("📴 無音検出、録音終了")
                        break

            if not audio_data:
                continue

            total_duration = (
                sum(len(chunk) for chunk in audio_data) / self.sample_rate
            )
            if total_duration < 0.5:
                print("⚠️ 録音が短すぎるためスキップ")
                continue

            audio_segment = np.concatenate(audio_data)
            print("🏋️ Whisperで文字起こし開始")
            image_snapshot = image_at_trigger
            with NamedTemporaryFile(suffix=".wav", delete=True) as tmp_file:
                wav.write(
                    tmp_file.name,
                    self.sample_rate,
                    (audio_segment * 32767).astype(np.int16),
                )
                tmp_file.flush()
                result = self.model.transcribe(
                    tmp_file.name,
                    language="ja",
                    fp16=torch.cuda.is_available()
                )
                transcription_text = result["text"]
                print("🔢 文字起こし結果:", transcription_text)
                # 文字起こし結果を出力キューに投入
                await self.result_queue.put(transcription_text)  # audio-only用
                await self.result_bundle_queue.put(
                    {  # image対応用
                        "text": transcription_text,
                        "image": image_snapshot,
                    }
                )


def is_invalid_transcription(text: str, repeat_threshold: int = 5) -> bool:
    if not text.strip():
        return True  # 空文字

    # 単語ベースでの繰り返しも試みる（日本語形態素解析なしで文字nグラムで近似）
    ngram_lengths = [4, 6, 8]  # 短〜中程度の語の繰り返しをカバー
    for n in ngram_lengths:
        chunks = [text[i : i + n] for i in range(0, len(text) - n + 1)]
        counts = Counter(chunks)
        for token, count in counts.items():
            if count >= repeat_threshold:
                print(f"🚫 繰り返し検出: '{token}' が {count} 回")
                return True

    # 同一文字の連続（例: ああああああ）
    if re.search(r"(.)\1{6,}", text):
        return True

    return False
