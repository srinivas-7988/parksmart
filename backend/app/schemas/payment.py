from pydantic import BaseModel
from typing import Optional


class PaymentCreate(BaseModel):
    booking_id: str
    amount: float


class PaymentResponse(BaseModel):
    payment_id: str
    booking_id: str
    amount: float
    status: str


class RazorpayOrderCreate(BaseModel):
    booking_id: str
    amount: float
    currency: Optional[str] = "INR"


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    booking_id: str
    is_simulated: Optional[bool] = False


class RazorpayVerifyPayment(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None