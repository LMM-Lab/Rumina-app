# This module provides functions to select the appropriate instances
# based on the model name for TTS, transcription, and multimodal response.

import asyncio

from api.modules.transcribers.whisper_transcriber import (
    WhisperSimpleTranscriber,
)
from services.openai_chat import get_chat_response, get_multimodal_response
from services.tts_generator import TTSGenerator


def get_transcriber_instance(model_name: str):
    if model_name.startswith("rumina-m1"):
        whisper_transcriber = WhisperSimpleTranscriber()
        return whisper_transcriber
    else:
        raise ValueError(f"Unsupported model: {model_name}")


def get_multimodal_response_func(model_name: str):
    if model_name.startswith("rumina-m1"):
        return get_multimodal_response
    else:
        raise ValueError(f"Unsupported model: {model_name}")


tts_instance = TTSGenerator()


def get_tts_instance(model_name: str):
    if model_name.startswith("rumina-m1"):
        return tts_instance
    else:
        raise ValueError(f"Unsupported model: {model_name}")
