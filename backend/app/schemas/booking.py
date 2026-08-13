from pydantic import BaseModel
from typing import Optional


class BookingCreate(BaseModel):
    vehicle_number: str
    slot_number: str
    location: Optional[str] = None
    booking_date: Optional[str] = None
    duration: Optional[int] = None
    start_time: Optional[int] = None
