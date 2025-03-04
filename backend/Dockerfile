# ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリ
WORKDIR /app

# 依存ライブラリインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーション本体をコピー
COPY ./app /app/app

# FastAPIアプリ起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
