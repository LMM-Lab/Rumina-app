from abc import ABC, abstractmethod
from typing import Dict, List, Optional

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
        """テキスト／マルチモーダル応答を返す（非同期でも同期でも可）"""
