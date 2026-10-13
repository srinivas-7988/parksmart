from pydantic import BaseModel
from typing import Optional


class ParkingSlotCreate(BaseModel):
    slot_number: str
    floor: int
    section: str
    vehicle_type: str
    location: str


class ParkingSlotUpdate(BaseModel):
    floor: Optional[int] = None
    section: Optional[str] = None
    vehicle_type: Optional[str] = None
    location: Optional[str] = None
    is_available: Optional[bool] = None