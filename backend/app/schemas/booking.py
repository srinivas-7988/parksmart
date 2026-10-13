from pydantic import BaseModel

class BookingCreate(BaseModel):
    vehicle_number: str
    slot_number: str
    location: str
    booking_date: str
    start_time: str
    duration: int
    total: int