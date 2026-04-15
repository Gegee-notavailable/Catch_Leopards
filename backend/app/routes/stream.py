import time

import cv2
import numpy as np
from fastapi import APIRouter
from fastapi.responses import Response, StreamingResponse

from app.services.stream import get_current_status, get_latest_frame

router = APIRouter()


def _make_no_signal_jpeg() -> bytes:
    """สร้างภาพ 'No Signal' สำหรับแสดงเมื่อกล้องไม่ได้เชื่อมต่อ"""
    img = np.zeros((360, 640, 3), dtype=np.uint8)
    img[:] = (30, 30, 30)
    cv2.putText(img, "No Signal", (220, 170), cv2.FONT_HERSHEY_SIMPLEX, 1.8, (180, 180, 180), 3)
    cv2.putText(img, "Waiting for camera...", (170, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (120, 120, 120), 2)
    _, jpeg = cv2.imencode(".jpg", img)
    return jpeg.tobytes()


_NO_SIGNAL = _make_no_signal_jpeg()


def _mjpeg_generator():
    while True:
        frame = get_latest_frame()
        data = frame if frame else _NO_SIGNAL
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + data + b"\r\n"
        )
        time.sleep(0.033)


@router.get("/stream", summary="MJPEG live stream จาก IP Camera")
def live_stream():
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/frame", summary="ดึง frame ล่าสุดเป็น JPEG เดียว (สำหรับ polling)")
def latest_frame():
    frame = get_latest_frame()
    data = frame if frame else _NO_SIGNAL
    return Response(content=data, media_type="image/jpeg")


@router.get("/status", summary="สถานะการตรวจจับล่าสุด")
def current_status():
    return {"status": get_current_status()}
