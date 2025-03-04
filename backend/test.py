import base64
import os
from typing import Any, Optional

import cv2
import numpy as np
from fastapi import HTTPException
from numpy.typing import NDArray
from ultralytics import YOLO

MODEL_BASE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "../../models/yolo/detection"
)

SUBTASK_MODEL_DIR_MAP = {
    "normal": os.path.join(MODEL_BASE_DIR, "normal"),
    "furniture": os.path.join(MODEL_BASE_DIR, "furniture"),
}

model_cache = {}


def get_model(model_name: str, subtask: str) -> YOLO:
    key = f"{subtask}_{model_name}"
    if key not in model_cache:
        model_dir = SUBTASK_MODEL_DIR_MAP.get(subtask)
        if model_dir is None:
            raise HTTPException(
                status_code=400, detail=f"Subtask '{subtask}' is not supported"
            )
        model_path = os.path.join(model_dir, f"{model_name}.pt")
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' for subtask '{subtask}' not found",
            )
        model_cache[key] = YOLO(model_path)
    return model_cache[key]


def run_object_detection(
    image: NDArray[np.uint8],
    model_name: str,
    version: Optional[str],
    subtask: str,
    annotate: bool,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    """
    物体検出の処理を実行する
    - `subtask` と `model_name` に応じて適切なモデルをロード
    - `file.file` を YOLO に直接渡して推論
    """
    # サブタスクに対応するディレクトリを取得
    model = get_model(model_name, subtask)

    results = model.predict(image, **parameters)
    result = results[0]

    # レスポンスを作成
    response: dict[str, Any] = {"results": result.to_json()}
    if annotate:
        annotated_img = result.plot()  # 画像を取得 (NumPy 配列)
        _, buffer = cv2.imencode(
            ".jpg", annotated_img
        )  # 🔥 OpenCVでエンコード
        response["annotated_image_base64"] = base64.b64encode(
            buffer.tobytes()
        ).decode("utf-8")

    return response
