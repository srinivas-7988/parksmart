from pydantic import BaseModel
from typing import Optional


class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    brand: str
    model: str
    color: str


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None