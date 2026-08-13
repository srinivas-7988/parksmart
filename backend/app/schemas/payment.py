from pydantic import BaseModel


class PaymentCreate(BaseModel):
    booking_id: str
    amount: float


class PaymentResponse(BaseModel):
    payment_id: str
    booking_id: str
    amount: float
    status: str