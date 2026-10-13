from fastapi import APIRouter
from pydantic import BaseModel

from app.ml.parking_model import predict_parking


router = APIRouter()


class PredictionRequest(BaseModel):

    hour: int
    day: int
    traffic: str
    capacity: int
    occupied: int


@router.post("/predict")
async def predict(data: PredictionRequest):

    result = predict_parking(
        hour=data.hour,
        day=data.day,
        traffic=data.traffic,
        capacity=data.capacity,
        occupied=data.occupied
    )

    return result