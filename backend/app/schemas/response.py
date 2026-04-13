from pydantic import BaseModel
from typing import List, Optional

class DetectionBox(BaseModel):
    """โมเดลสำหรับพิกัดตีกรอบ (Bounding Box)"""
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionResult(BaseModel):
    """โมเดลสำหรับผลลัพธ์การตรวจจับแต่ละตัวในภาพ"""
    label: str           # เช่น 'leopard', 'cat', 'dog'
    confidence: float    # ค่าความมั่นใจ 0.0 - 1.0
    box: DetectionBox    # พิกัดของวัตถุ

class DetectionResponse(BaseModel):
    """โมเดลหลักที่จะตอบกลับไปหา Frontend"""
    status: str                         # เช่น 'leopard', 'detecting', 'domestic'
    message: str                        # ข้อความอธิบาย เช่น 'พบเสือดาวในพื้นที่!'
    detections: List[DetectionResult]   # รายการวัตถุที่เจอ (กรณีเจอหลายตัว)
    count: int                          # จำนวนที่ตรวจพบ
    processing_time: float              # เวลาที่ใช้ประมวลผล (วินาที)