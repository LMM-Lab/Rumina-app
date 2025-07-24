from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, List, Optional

from .tokenizer import get_tokenizer
from .types import GenerationResult


class BaseVLM(ABC):
    @property
    @abstractmethod
    def model_name(self) -> str:
        """DBカタログの vlm_id にマッピングされる一意キー"""

    async def count_tokens(self, text: str) -> int:
        tokenizer = get_tokenizer(self.model_name)
        return len(tokenizer(text))

    @abstractmethod
    async def generate(
        self,
        message: str,
        history: List[Dict[str, str]],
        image_base64: Optional[str] = None,
    ) -> GenerationResult:
        """全文（完了形）を返す。"""
        ...

    @abstractmethod
    async def stream_generate(
        self,
        message: str,
        history: List[Dict[str, str]],
        image_base64: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """トークンまたは文チャンクを ``async for`` で逐次返す。"""
        ...
