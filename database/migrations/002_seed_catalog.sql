INSERT INTO stt_catalog(stt_id,short_key,model_name,version,precision,provider)
VALUES
('whisper_base','whisper-B','Whisper Base','v3','fp16','local'),
('gpt-4o-transcribe','gpt-4o-stt','gpt-4o-transcribe','2025-04','fp16','api');

INSERT INTO vlm_catalog(vlm_id,short_key,model_name,version,param_million,precision,architecture,provider)
VALUES
('gpt-4o','gpt-4o','GPT-4o','2025-04',NULL,'fp16','proprietary', 'api');

INSERT INTO tts_catalog(tts_id,short_key,model_name,version,precision,provider)
VALUES
('kokoro_tts','kokoro-tts','Kokoro TTS','v1.0','fp16','local'),
('style_bert_vits2','stylebert-vits2','Style-BERT-VITS2','v2.1','fp16','local'),
('openai_tts-1','tts-1','OpenAI TTS','2025-04','fp16','api');
