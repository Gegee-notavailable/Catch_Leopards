"""
Stream Service
--------------
Background thread ที่ทำงานตลอดเวลา:
  1. ดึง frame จาก IP Camera (OpenCV)
  2. Enhance: CLAHE + Defogging
  3. Run inference ทุก PROCESS_INTERVAL วินาที
  4. ถ้าพบเสือดาว → LINE Notify + Firebase
  5. เก็บ JPEG ล่าสุดไว้ให้ endpoint /stream ดึงไปส่งต่อ (MJPEG)
"""

import os
import threading
import time

import cv2
import numpy as np
from PIL import Image

from app.services.enhancement import enhance_frame
from app.services.firebase_service import push_detection
from app.services.inference import run_inference
from app.services.notifier import send_line_notify
from app.services.preprocessing import prepare_image

# ---- Config defaults (ค่าจริงอ่านใน _processing_loop หลัง load_dotenv ทำงาน) ---
_DEFAULT_CAM_URL = "http://192.168.1.100:8080/video"
_DEFAULT_INTERVAL = 1.0

# ---- Shared state (thread-safe) -------------------------------------------
_lock = threading.Lock()
_latest_frame: bytes = b""
_current_status: str = "clear"


def get_latest_frame() -> bytes:
    with _lock:
        return _latest_frame


def get_current_status() -> str:
    with _lock:
        return _current_status


# ---- Background worker ----------------------------------------------------

def _processing_loop() -> None:
    global _latest_frame, _current_status

    # อ่านค่า env ตรงนี้ (หลัง load_dotenv() ทำงานแล้ว)
    cam_source = os.getenv("IP_CAMERA_URL", _DEFAULT_CAM_URL)
    process_interval = float(os.getenv("PROCESS_INTERVAL", str(_DEFAULT_INTERVAL)))

    # ถ้า IP_CAMERA_URL เป็นตัวเลข → ใช้เป็น device index (DroidCam Virtual Webcam)
    # ถ้าเป็น URL → ใช้เป็น HTTP stream
    try:
        cam_source = int(cam_source)
        print(f"[STREAM] Using device index: {cam_source} (Virtual Webcam)")
    except ValueError:
        print(f"[STREAM] Connecting to: {cam_source}")

    cap = cv2.VideoCapture(cam_source)
    last_inference_at: float = 0.0

    while True:
        ret, frame = cap.read()

        if not ret:
            print("[WARN] Stream lost — retrying in 3s...")
            cap.release()
            time.sleep(3)
            cap = cv2.VideoCapture(cam_source)
            continue

        # Step 1: Enhance
        enhanced = enhance_frame(frame)

        # Step 2: อัปเดต MJPEG buffer
        ok, jpeg = cv2.imencode(".jpg", enhanced, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if ok:
            with _lock:
                _latest_frame = jpeg.tobytes()

        # Step 3: Inference (ตาม interval ที่กำหนด)
        now = time.time()
        if now - last_inference_at < process_interval:
            continue

        last_inference_at = now

        rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        tensor = prepare_image(pil_img)
        result = run_inference(tensor)

        status = result.get("status", "clear")
        detections = result.get("detections", [])

        with _lock:
            _current_status = status

        # Step 4: Firebase (บันทึกทุก detection)
        push_detection(status, detections)

        # Step 5: LINE Notify เฉพาะเสือดาว (notifier จัดการ cooldown เอง)
        if status == "leopard":
            count = result.get("count", 0)
            ts = time.strftime("%H:%M:%S")
            send_line_notify(f"\n⚠️ พบเสือดาว {count} ตัว!\nเวลา: {ts}")


def start_stream_processor() -> None:
    """เรียกครั้งเดียวตอน app startup"""
    t = threading.Thread(target=_processing_loop, daemon=True, name="stream-processor")
    t.start()
    print("[OK] Stream processor started (background thread)")
