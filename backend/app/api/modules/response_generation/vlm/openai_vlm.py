import base64
import os
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

from .base import BaseVLM

load_dotenv()

# OpenAIのAPIキー
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_clinet = OpenAI(api_key=OPENAI_API_KEY)


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
    ) -> str:
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

        response = openai_clinet.chat.completions.create(
            model=self._model_name,
            messages=messages,
            max_tokens=500,
            temperature=1,
        )
        return response.choices[0].message.content.strip()
