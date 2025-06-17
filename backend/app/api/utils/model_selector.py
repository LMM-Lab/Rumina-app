# This module provides functions to select the appropriate instances
# based on the model name for TTS, transcription, and multimodal response.
import torch
from api.modules.transcribers.transcribers import (
    OpenAITranscriber,
    WhisperLocalTranscriber,
)
from api.modules.tts_wrappers.openai_tts import OpenAI_TTS
from api.modules.tts_wrappers.style_bert_vits2_wrapper import (
    RuminaStyleBertVITS2Wrapper,
)
from services.openai_chat import get_multimodal_response
from services.tts_generator import TTSGenerator

device = "cuda" if torch.cuda.is_available() else "cpu"


def get_transcriber_instance(model_name: str):
    if model_name == "rumina-m1":
        print("🔊 WhisperLocalTranscriber を使用")
        whisper_transcriber = WhisperLocalTranscriber()
        return whisper_transcriber
    elif model_name == "rumina-m1-pro":
        print("🔊 OpenAITranscriber を使用")
        openai_transcriber = OpenAITranscriber()
        return openai_transcriber
    elif model_name == "rumina-m1-promax":
        print("🔊 OpenAITranscriber を使用")
        openai_transcriber = OpenAITranscriber()
        return openai_transcriber
    else:
        raise ValueError(f"Unsupported model: {model_name}")


def get_multimodal_response_func(model_name: str):
    if model_name == "rumina-m1":
        return get_multimodal_response
    elif model_name == "rumina-m1-pro":
        return get_multimodal_response
    elif model_name == "rumina-m1-promax":
        return get_multimodal_response
    else:
        raise ValueError(f"Unsupported model: {model_name}")


tts_instance = TTSGenerator()
rumina_tts_instance = RuminaStyleBertVITS2Wrapper(
    model_dir="/workspace/backend/app/model/tts/richika_v1", device=device
)
openai_tts_instance = OpenAI_TTS()


def get_tts_instance(model_name: str):
    if model_name == "rumina-m1":
        return tts_instance
    elif model_name == "rumina-m1-pro":
        return rumina_tts_instance
    elif model_name == "rumina-m1-promax":
        return openai_tts_instance
    else:
        raise ValueError(f"Unsupported model: {model_name}")
