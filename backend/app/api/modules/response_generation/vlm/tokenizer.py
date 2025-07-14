import re
from typing import Callable, Sequence

Tokenizer = Callable[[str], Sequence[int]]
_TOKENIZER_REGISTRY: dict[str, Tokenizer] = {}


def register_tokenizer(model_name: str, fn: Tokenizer) -> None:
    _TOKENIZER_REGISTRY[model_name] = fn


def get_tokenizer(model_name: str) -> Tokenizer:
    return _TOKENIZER_REGISTRY.get(model_name, _char_fallback)


def _char_fallback(text: str) -> Sequence[int]:
    # 最低限 1 文字 = 1 トークンで数えるフォールバック
    return list(text)
