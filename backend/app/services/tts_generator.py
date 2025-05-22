import base64
import io
from collections import defaultdict

import torch
from torch.serialization import add_safe_globals
from TTS.utils.radam import RAdam

add_safe_globals([RAdam, defaultdict, dict])

from TTS.api import TTS


class TTSGenerator:
    def __init__(self):
        use_gpu = torch.cuda.is_available()
        self.tts = TTS(
            model_name="tts_models/ja/kokoro/tacotron2-DDC",
            gpu=use_gpu,
            progress_bar=False,
        )

    def synthesize_to_base64(self, text: str) -> str:
        """音声をBase64形式で返す"""
        buffer = io.BytesIO()
        self.tts.tts_to_file(text, file_path=buffer)
        buffer.seek(0)
        audio_base64 = base64.b64encode(buffer.read()).decode("utf-8")
        return audio_base64


# if __name__ == "__main__":
#     test_message = "こんにちは！調子はどう？"
#     tts_model = TTSGenerator()
#     result = tts_model.synthesize_to_base64(test_message)
