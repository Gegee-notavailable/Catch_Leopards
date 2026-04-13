import numpy as np
from PIL import Image

def prepare_image(image: Image.Image, target_size=(640, 640)):
    """
    แปลงรูปภาพจาก PIL Image ให้เป็น Tensor (Numpy) ที่พร้อมส่งเข้าโมเดล
    :param image: รูปภาพที่ส่งมาจาก Frontend (PIL Object)
    :param target_size: ขนาดที่โมเดลต้องการ (ปกติคือ 640x640 สำหรับ YOLO)
    :return: numpy array ที่มีมิติ [1, 3, 640, 640]
    """
    # 1. ปรับขนาดรูปภาพ (Resize) 
    # ใช้ Image.LANCZOS เพื่อให้ภาพยังคงรายละเอียดที่ดี
    img = image.resize(target_size, resample=Image.LANCZOS)

    # 2. แปลงเป็น Numpy Array และปรับค่าสีจาก 0-255 ให้เป็น 0.0 - 1.0 (Normalization)
    img_array = np.array(img).astype(np.float32) / 255.0

    # 3. สลับแกน (H, W, C) -> (C, H, W)
    # เดิม: [640, 640, 3] (สูง, กว้าง, สี RGB)
    # ใหม่: [3, 640, 640] (สี RGB, สูง, กว้าง) ตามที่ ONNX ต้องการ
    img_array = np.transpose(img_array, (2, 0, 1))

    # 4. เพิ่มมิติ Batch (Add Batch Dimension)
    # จาก [3, 640, 640] -> [1, 3, 640, 640]
    img_array = np.expand_dims(img_array, axis=0)

    return img_array