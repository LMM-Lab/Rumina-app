import asyncio
import base64
import os
from typing import AsyncIterator, Optional

import tiktoken
from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAI, Stream

from .base import BaseVLM
from .tokenizer import register_tokenizer
from .types import GenerationResult

load_dotenv()

# OpenAIのAPIキー
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)
openai_client2 = AsyncOpenAI(api_key=OPENAI_API_KEY)


# ---- tokenizer 登録 -------------------------------------------------
_enc = tiktoken.encoding_for_model("gpt-4o")


def _tok_openai(text: str):
    return _enc.encode(text)


register_tokenizer("gpt-4o", _tok_openai)


class OpenAIVLM(BaseVLM):
    def __init__(self, model: str = "gpt-4o"):
        self._model_name = model

    @property
    def model_name(self) -> str:
        return self._model_name

    async def generate(
        self,
        message: str,
        history: list[dict[str, str]],
        image_base64: Optional[str] = None,
        system_prompt: str = (
            "あなたは気さくで話しやすい会話アシスタントです。"
            "ユーザーとは友達感覚で話し、長すぎる説明は避け、テンポよく短めの発言を心がけてください。"
            "必要以上に丁寧すぎず、自然な口調でカジュアルに答えてください。"
            "ユーザーの発言が画像に関係ない場合、視覚情報には言及せず、テキストだけで返答してください。"
        ),
    ) -> GenerationResult:
        # Base64文字列からプレフィックス（例: data:image/jpeg;base64,）を取り除く
        if image_base64:
            if image_base64.startswith("data:image"):
                image_base64 = image_base64.split(",")[1]

        # ユーザーの画像付き発話
        if image_base64 is None:
            image_url = None
        else:
            image_url = {"url": f"data:image/png;base64,{image_base64}"}

        # ユーザーの発話と画像を含むメッセージ
        if image_url is None:
            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": message,
                },
            ]

        else:
            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": message,
                        },
                        {
                            "type": "image_url",
                            "image_url": image_url,
                        },
                    ],
                },
            ]

        response = openai_client.chat.completions.create(
            model=self._model_name,
            messages=messages,
            max_tokens=500,
            temperature=1,
        )

        # ---------- トークン数計測 ----------
        prompt_tokens = await self.count_tokens(message)
        completion_tokens = await self.count_tokens(
            response.choices[0].message.content.strip()
        )

        return GenerationResult(
            content=response.choices[0].message.content.strip(),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

    async def stream_generate(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
        image_base64: Optional[str] = None,
        *,
        system_prompt: str | None = None,
        max_tokens: int = 512,
        temperature: float = 0.9,
    ) -> AsyncIterator[str]:
        """トークンまたはチャンクを逐次 yield する非同期ジェネレータ."""

        body_messages = self._build_messages(
            message, image_base64, system_prompt
        )
        if history:
            body_messages = history + body_messages[1:]

        # OpenAI 非同期ストリーム
        stream = await openai_client2.chat.completions.create(
            model=self._model_name,
            messages=body_messages,
            max_tokens=512,
            temperature=0.9,
            stream=True,
        )

        async for chunk in stream:  # type: ignore[attr-defined]
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    # ------------------------------------------------------------------
    # internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _build_messages(
        user_text: str,
        image_b64: Optional[str],
        system_prompt: Optional[str],
    ) -> list[dict[str, object]]:
        if system_prompt is None:
            system_prompt = (
                "あなたは気さくで話しやすい会話アシスタントです。"
                "ユーザーとは友達感覚で話し、長すぎる説明は避け、テンポよく短めの発言を心がけてください。"
                "必要以上に丁寧すぎず、自然な口調でカジュアルに答えてください。"
                "ユーザーの発言が画像に関係ない場合、視覚情報には言及せず、テキストだけで返答してください。"
            )

        # 画像が渡されていれば data URL へ整形
        if image_b64:
            if image_b64.startswith("data:image"):
                image_b64 = image_b64.split(",", 1)[1]
            image_url_block = {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_b64}"},
            }
            user_block = [
                {"type": "text", "text": user_text},
                image_url_block,
            ]
        else:
            user_block = user_text

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_block},
        ]
