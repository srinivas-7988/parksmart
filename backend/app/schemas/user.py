from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    vehicle_number: Optional[str] = None


class PhoneOTPRequest(BaseModel):
    phone: str


class VerifyPhoneOTPRequest(BaseModel):
    phone: str
    otp: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ===========================
# FORGOT PASSWORD
# ===========================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str