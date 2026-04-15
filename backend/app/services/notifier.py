import os
import requests

LINE_NOTIFY_URL = "https://notify-api.line.me/api/notify"
_cooldown_last_sent: float = 0.0
COOLDOWN_SECONDS = 30


def send_line_notify(message: str) -> bool:
    """ส่ง alert ผ่าน LINE Notify (มี cooldown 30 วินาที กัน spam)"""
    import time

    global _cooldown_last_sent

    token = os.getenv("LINE_NOTIFY_TOKEN", "")
    if not token or token == "your_line_notify_token_here":
        return False  # ข้ามถ้ายังไม่ได้ตั้งค่า token จริง

    now = time.time()
    if now - _cooldown_last_sent < COOLDOWN_SECONDS:
        return False

    try:
        response = requests.post(
            LINE_NOTIFY_URL,
            headers={"Authorization": f"Bearer {token}"},
            data={"message": message},
            timeout=5,
        )
        if response.status_code == 200:
            _cooldown_last_sent = now
            print("✅ LINE Notify ส่งสำเร็จ")
            return True
        else:
            print(f"❌ LINE Notify ผิดพลาด: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ LINE Notify exception: {e}")
        return False
