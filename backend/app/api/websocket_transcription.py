from services.audio_transcriber import WhisperAudioTranscriber

# Whisper モデルの初期化とタスク起動
transcriber_instance = WhisperAudioTranscriber(use_vad=True)
