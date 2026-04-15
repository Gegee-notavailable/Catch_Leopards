from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import run_inference
from app.services.preprocessing import prepare_image
from app.schemas.response import DetectionResponse
import io
from PIL import Image

router = APIRouter()

@router.post("/predict", response_model=DetectionResponse)
async def predict(file: UploadFile = File(...)):
    # 1. ตรวจสอบประเภทไฟล์
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="ไฟล์ที่ส่งมาต้องเป็นรูปภาพเท่านั้น!")

    try:
        # 2. อ่านข้อมูลภาพจาก bytes
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # 3. Preprocessing: ปรับขนาด/รูปแบบภาพให้ตรงกับที่โมเดล ONNX ต้องการ
        # (เรียกใช้ service ที่อยู่ในโครงสร้างโฟลเดอร์ของคุณ)
        input_tensor = prepare_image(image)

        # 4. Inference: ส่งไปให้สมองกล (ONNX Model) ประมวลผล
        results = run_inference(input_tensor)

        # 5. ตอบกลับข้อมูลในรูปแบบที่ Frontend เข้าใจ (ตาม schemas/response.py)
        # ตัวอย่าง: {"status": "Leopard Detected!", "confidence": 0.95, "bbox": [x1, y1, x2, y2]}
        return results

    except Exception as e:
        print(f"❌ Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการประมวลผลภาพ")