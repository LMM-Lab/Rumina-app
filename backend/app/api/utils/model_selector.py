# This module provides functions to select the appropriate instances
# based on the model name for TTS, transcription, and multimodal response.
from api.modules.transcribers.transcribers import (
    OpenAITranscriber,
    WhisperLocalTranscriber,
)
from services.openai_chat import get_chat_response, get_multimodal_response
from services.tts_generator import TTSGenerator


def get_transcriber_instance(model_name: str):
    if model_name == "rumina-m1":
        print("🔊 WhisperLocalTranscriber を使用")
        whisper_transcriber = WhisperLocalTranscriber()
        return whisper_transcriber
    elif model_name == "rumina-m1-pro":
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
    else:
        raise ValueError(f"Unsupported model: {model_name}")


tts_instance = TTSGenerator()


def get_tts_instance(model_name: str):
    if model_name == "rumina-m1":
        return tts_instance
    elif model_name == "rumina-m1-pro":
        return tts_instance
    else:
        raise ValueError(f"Unsupported model: {model_name}")
