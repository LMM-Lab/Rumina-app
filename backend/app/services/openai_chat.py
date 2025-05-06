import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# OpenAIのAPIキー
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_clinet = OpenAI(api_key=OPENAI_API_KEY)


def get_chat_response(message: str, history: list[dict[str, str]] = []) -> str:
    """
    ChatGPTに対してユーザーの入力（+履歴）を送信し、応答を返す。

    Args:
        message (str): 現在のユーザーの入力メッセージ
        history (List[str]): 過去の発話履歴（任意）

    Returns:
        str: ChatGPTからの応答メッセージ
    """
    messages = [{"role": "system", "content": "You are a helpful assistant."}]

    # 過去の履歴も user 発話として追加（必要に応じて role を分けてもOK）
    for h in history:
        messages.append(h)

    # 今回の入力メッセージ
    messages.append({"role": "user", "content": message})

    # OpenAI Chat API 呼び出し
    response = openai_clinet.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=54,
        temperature=1,
        top_p=0.5,
        frequency_penalty=0,
        presence_penalty=0,
    )

    # 最初の選択肢を返す
    return response.choices[0].message.content.strip()


def get_multimodal_response(
    message: str,
    image_base64: str,
    history: list[dict[str, str]] = [],
    system_prompt: str = "You are a helpful assistant.",
) -> str:
    """
    GPT-4o を使って画像とテキストのマルチモーダル入力に基づいて応答を返す。

    Args:
        message (str): ユーザーからの質問・指示などのテキスト
        image_base64 (str): Base64でエンコードされた画像（JPEG/PNGなど）
        history (list[dict]): 過去のチャット履歴
        system_prompt (str): システムプロンプト

    Returns:
        str: GPT-4oによる応答テキスト
    """

    # Base64文字列からプレフィックス（例: data:image/jpeg;base64,）を取り除く
    if image_base64.startswith("data:image"):
        image_base64 = image_base64.split(",")[1]

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)

    image_url = {"url": f"data:image/png;base64,{image_base64}"}

    # ユーザーの画像付き発話
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
        model="gpt-4o",
        messages=messages,
        max_tokens=500,
        temperature=1,
    )

    return response.choices[0].message.content.strip()


# if __name__ == "__main__":
#     test_message = "こんにちは！調子はどう？"
#     result = get_chat_response(test_message)
#     print("🤖 ChatGPTの応答:", result)
