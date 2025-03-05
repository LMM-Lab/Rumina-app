FROM node:18

WORKDIR /app

# パッケージマネージャ
COPY package*.json ./

# 必要なライブラリのインストール
RUN npm install


# アプリケーションコードをコピー
COPY . .

# ビルド
RUN npm run build

# 環境変数
ENV NODE_ENV=production

# ポート指定
EXPOSE 3000

# 実行コマンド
CMD ["npm", "start"]