from pydantic import BaseModel, EmailStr
<<<<<<< HEAD
from typing import Optional
=======
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
<<<<<<< HEAD
    vehicle_number: Optional[str] = None
=======
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f


class UserLogin(BaseModel):
    email: EmailStr
<<<<<<< HEAD
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
=======
    password: str
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
