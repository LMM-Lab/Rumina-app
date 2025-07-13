from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class BaseVLM(ABC):
    @property
    @abstractmethod
    def model_name(self) -> str:
        """DBカタログの vlm_id にマッピングされる一意キー"""

    @abstractmethod
    async def generate(
        self,
        message: str,
        history: List[Dict[str, str]],
        image_base64: Optional[str] = None,
    ) -> str:
        """テキスト／マルチモーダル応答を返す（非同期でも同期でも可）"""
