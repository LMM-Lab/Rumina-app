# demo_stream.py  ← 実行用ワンファイルに分けると安全
import asyncio

from api.modules.response_generation.vlm.openai_vlm import OpenAIVLM


async def main() -> None:
    # インスタンス生成
    vlm = OpenAIVLM(model="gpt-4o")

    # ユーザー発話
    user_message = "こんにちは！夏休みのおすすめ旅行先を教えて。"

    print(">>> streaming response:")
    async for token in vlm.stream_generate(user_message):
        print(token, end="", flush=True)  # トークン到着ごとに出力

    print("\n>>> done")


if __name__ == "__main__":
    asyncio.run(main())
