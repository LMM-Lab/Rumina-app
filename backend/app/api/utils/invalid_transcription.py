import re
from collections import Counter


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
