from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict

def create_app() -> FastAPI:
    app = FastAPI(
        title="Leopard Detection API",
        description="Backend API for detecting leopards using ONNX models",
        version="1.0.0"
    )

    # 1. ตั้งค่า CORS (Cross-Origin Resource Sharing)
    # จำเป็นมากเพื่อให้ Frontend (Live Server) สามารถคุยกับ Backend (FastAPI) ได้
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # ในช่วงพัฒนาใช้ "*" แต่ตอนใช้งานจริงควรระบุ URL ของหน้าเว็บ
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. รวม Routes จากไฟล์อื่นๆ
    # จะทำให้ API ของคุณเรียกใช้ได้ผ่าน http://localhost:8000/api/v1/predict
    app.include_router(predict.router, prefix="/api/v1", tags=["Detection"])

    # 3. Health Check Route สำหรับเช็คว่า Server ยังไม่ตาย
    @app.get("/")
    async def root():
        return {
            "message": "Leopard Detection API is running!",
            "docs": "/docs"
        }

    return app

app = create_app()