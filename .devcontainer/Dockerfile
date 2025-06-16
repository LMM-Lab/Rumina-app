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
    git-lfs \
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

ARG HF_USERNAME
ARG HF_TOKEN
ENV HF_USERNAME=${HF_USERNAME}
ENV HF_TOKEN=${HF_TOKEN}

RUN git clone https://${HF_USERNAME}:${HF_TOKEN}@huggingface.co/ku-nlp/deberta-v2-large-japanese-char-wwm \
    /usr/local/lib/python3.10/dist-packages/style_bert_vits2/bert/deberta-v2-large-japanese-char-wwm
