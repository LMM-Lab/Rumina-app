# ベースイメージ
FROM ubuntu:22.04

USER root

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    curl \
    build-essential \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    xz-utils \
    file \
    sudo \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN pip install --upgrade pip setuptools

# ワークディレクトリを設定
WORKDIR /workspace

# 必要なPythonライブラリをインストール
COPY requirements.dev.txt /workspace/
RUN pip install -r requirements.dev.txt
