import io
import numpy as np
from PIL import Image

def bytes_to_pil(image_bytes: bytes) -> Image.Image:
    """แปลงข้อมูลรูปภาพจาก Bytes เป็น PIL Image"""
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")

def pil_to_bytes(image: Image.Image, format: str = "JPEG") -> bytes:
    """แปลง PIL Image กลับเป็น Bytes (สำหรับส่งออกหรือบันทึก)"""
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=format)
    return img_byte_arr.getvalue()

def resize_with_aspect_ratio(image: Image.Image, target_size=(640, 640)):
    """
    ปรับขนาดรูปภาพโดยรักษาอัตราส่วนเดิม (Letterbox) 
    ป้องกันไม่ให้รูปเบี้ยว ซึ่งสำคัญมากต่อความแม่นยำของ AI
    """
    image.thumbnail(target_size, Image.LANCZOS)
    new_img = Image.new("RGB", target_size, (0, 0, 0)) # สร้างพื้นหลังดำ
    # วางรูปลงตรงกลาง
    new_img.paste(image, ((target_size[0] - image.size[0]) // 2,
                          (target_size[1] - image.size[1]) // 2))
    return new_img

def get_image_dimensions(image_bytes: bytes):
    """ดึงขนาด Width และ Height ของรูปภาพ"""
    with Image.open(io.BytesIO(image_bytes)) as img:
        return img.size # (width, height)