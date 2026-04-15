import os
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore

_db = None


def init_firebase() -> bool:
    """โหลด Service Account และเชื่อม Firestore (เรียกครั้งเดียวตอน startup)"""
    global _db

    cred_path = os.getenv(
        "FIREBASE_CREDENTIALS_PATH",
        os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json"),
    )

    if not os.path.exists(cred_path):
        print(f"⚠️ ไม่พบ Firebase credentials ที่: {cred_path}")
        print("   → วาง service account JSON และตั้งค่า FIREBASE_CREDENTIALS_PATH ใน .env")
        return False

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    print("✅ Firebase Admin เชื่อมสำเร็จ")
    return True


def push_detection(status: str, detections: list) -> None:
    """บันทึกผลการตรวจจับลง Firestore collection 'detection_logs'"""
    if _db is None:
        return

    now = datetime.now()
    try:
        _db.collection("detection_logs").add(
            {
                "status": status,
                "detections": detections,
                "count": len(detections),
                "time": now.strftime("%I:%M %p"),
                "date": now.strftime("%Y-%m-%d"),
                "timestamp": firestore.SERVER_TIMESTAMP,
            }
        )
    except Exception as e:
        print(f"❌ Firebase push ผิดพลาด: {e}")
