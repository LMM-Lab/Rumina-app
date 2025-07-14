def make_set_id(
    stt_id: str,
    vlm_id: str,
    tts_id: str,
    filler_id: str | None = None,
    set_type: str = "single",
) -> str:
    """
    モデルの組み合わせから再現可能な set_id を作成する。
    例: "whisper-base/gpt-4o/style-bert-vits2:single"
    """
    parts = [stt_id, vlm_id, tts_id]
    if filler_id:
        parts.append(filler_id)
    return "/".join(parts) + f":{set_type}"
