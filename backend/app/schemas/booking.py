from pydantic import BaseModel
<<<<<<< HEAD
from typing import Optional
=======
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f


class BookingCreate(BaseModel):
    vehicle_number: str
<<<<<<< HEAD
    slot_number: str
    location: Optional[str] = None
    booking_date: Optional[str] = None
    duration: Optional[int] = None
    start_time: Optional[int] = None
=======
    slot_number: str
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
