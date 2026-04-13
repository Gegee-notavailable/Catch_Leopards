import onnxruntime as ort
import numpy as np
import time
import os

# 1. ระบุ Path ของไฟล์โมเดล
MODEL_PATH = os.path.join("app", "models", "model.onnx")

# 2. โหลดโมเดลขึ้นมา (ทำครั้งเดียวตอน Start Server เพื่อความเร็ว)
try:
    session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    print(f"✅ Model loaded successfully. Input name: {input_name}")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    session = None

def run_inference(input_tensor):
    """
    ฟังก์ชันสำหรับรัน Model ประมวลผล
    :param input_tensor: ภาพที่ผ่านการเตรียม (Preprocessed) มาเป็น Numpy Array
    :return: Dictionary ผลลัพธ์ที่สอดคล้องกับ DetectionResponse schema
    """
    if session is None:
        return {"status": "error", "message": "Model not loaded"}

    start_time = time.time()

    # --- Step 3: รันโมเดล (Inference) ---
    # input_tensor ต้องมีมิติเป็น [1, 3, 640, 640] ตามที่ YOLO ต้องการ
    outputs = session.run(None, {input_name: input_tensor})

    # --- Step 4: ประมวลผล Output (Post-processing) ---
    # หมายเหตุ: ผลลัพธ์จาก ONNX มักจะเป็น Array ดิบ 
    # เราต้องส่งไปให้ postprocessing.py จัดการต่อ แต่เบื้องต้นผมจะจำลองการแปลงค่าให้ดูครับ
    
    # สมมติผลลัพธ์ (Mock-up logic)
    # ในความเป็นจริงคุณต้องดึงค่าจาก outputs[0] มาทำ Non-Maximum Suppression (NMS)
    detections = []
    
    # ตัวอย่างการดึงค่า (ต้องปรับตาม Output ของโมเดลคุณ)
    # label = "leopard" if outputs_have_leopard else "none"
    
    processing_time = time.time() - start_time

    # ส่งค่ากลับไปในรูปแบบที่สอดคล้องกับ schemas/response.py
    return {
        "status": "leopard", # หรือจะดึงจาก Logic การตรวจจับ
        "message": "Detection completed",
        "detections": detections,
        "count": len(detections),
        "processing_time": round(processing_time, 4)
    }