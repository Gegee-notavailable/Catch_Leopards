from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import predict
from app.routes import stream as stream_route
from app.services.firebase_service import init_firebase
from app.services.stream import start_stream_processor

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    init_firebase()
    start_stream_processor()
    yield
    # --- Shutdown (ไม่ต้องทำอะไร เพราะ thread เป็น daemon) ---


def create_app() -> FastAPI:
    app = FastAPI(
        title="Leopard Detection API",
        description="Backend API for detecting leopards using ONNX models",
        version="2.0.0",
        lifespan=lifespan,
    )

    # CORS — ในช่วงพัฒนาใช้ * แต่ production ควรระบุ origin จริง
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(predict.router, prefix="/api/v1", tags=["Detection"])
    app.include_router(stream_route.router, prefix="/api/v1", tags=["Stream"])

    @app.get("/")
    async def root():
        return {"message": "Leopard Detection API is running!", "docs": "/docs"}

    return app


app = create_app()
