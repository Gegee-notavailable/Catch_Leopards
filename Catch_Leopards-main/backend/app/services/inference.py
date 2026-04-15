import ast
import os
import time

import numpy as np
import onnx
import onnxruntime as ort

from app.services.postprocessing import postprocess

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best.onnx")

# โหลดโมเดลครั้งเดียวตอน start server
try:
    session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    print(f"[OK] Model loaded. Input: {input_name}")

    # อ่าน class names จาก ONNX metadata
    CLASS_NAMES = []
    try:
        m = onnx.load(MODEL_PATH)
        for prop in m.metadata_props:
            if prop.key == "names":
                names_dict = ast.literal_eval(prop.value)
                CLASS_NAMES = [names_dict[i] for i in sorted(names_dict.keys())]
                break
    except Exception as e:
        print(f"[WARN] Cannot read class names: {e}")

    if not CLASS_NAMES:
        CLASS_NAMES = [f"class_{i}" for i in range(80)]
    print(f"[OK] Classes: {CLASS_NAMES}")

except Exception as e:
    print(f"[ERR] Failed to load model: {e}")
    session = None
    CLASS_NAMES = []


def run_inference(input_tensor: np.ndarray) -> dict:
    if session is None:
        return {
            "status": "error",
            "message": "Model not loaded",
            "detections": [],
            "count": 0,
            "processing_time": 0.0,
        }

    start = time.time()
    outputs = session.run(None, {input_name: input_tensor})
    detections, status = postprocess(outputs, CLASS_NAMES, conf_threshold=0.5)
    elapsed = time.time() - start

    if status == "leopard":
        msg = f"Found leopard: {len(detections)}"
    elif detections:
        msg = f"Found animal: {len(detections)}"
    else:
        msg = "No animal detected"

    return {
        "status": status,
        "message": msg,
        "detections": detections,
        "count": len(detections),
        "processing_time": round(elapsed, 4),
    }
