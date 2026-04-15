from typing import List

from pydantic import BaseModel


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Detection(BaseModel):
    label: str
    confidence: float
    box: BoundingBox


class DetectionResponse(BaseModel):
    status: str
    message: str
    detections: List[Detection]
    count: int
    processing_time: float
