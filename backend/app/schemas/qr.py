from pydantic import BaseModel


class QRResponse(BaseModel):
    booking_id: str
    qr_path: str