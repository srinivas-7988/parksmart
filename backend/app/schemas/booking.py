from pydantic import BaseModel


class BookingCreate(BaseModel):
    vehicle_number: str
    slot_number: str