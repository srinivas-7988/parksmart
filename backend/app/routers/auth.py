<<<<<<< HEAD
from datetime import datetime, timedelta
import random

from fastapi import APIRouter, Depends, HTTPException

from app.auth.auth_bearer import JWTBearer
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.database.database import db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
)
from app.services.email_service import send_email
=======
from fastapi import APIRouter, HTTPException, Depends
from app.database.database import db
from app.schemas.user import UserCreate, UserLogin
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.auth_bearer import JWTBearer
import traceback
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f

router = APIRouter()


<<<<<<< HEAD
@router.post("/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "password": hash_password(user.password),
        "role": "user",
    }
    await db.users.insert_one(new_user)

    if user.vehicle_number:
        vehicle_number = user.vehicle_number.strip().upper()
        if vehicle_number:
            await db.vehicles.insert_one({
                "user_email": user.email,
                "vehicle_number": vehicle_number,
                "vehicle_type": "car",
                "brand": "",
                "model": "",
                "color": "",
                "created_at": datetime.utcnow(),
            })

    await send_email(
        user.email,
        "Welcome to ParkSmart 🚗",
        f"""Hello {user.full_name},\n\nYour ParkSmart account has been created successfully.\n\nYou can now book parking slots, make payments and generate QR codes.\n\nHappy Parking!\n\nParkSmart Team""",
    )

    return {"message": "User Registered Successfully"}


@router.post("/login")
async def login(user: UserLogin):
    existing_user = await db.users.find_one({"email": user.email})
    if not existing_user or not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid Email or Password")

    access_token = create_access_token({
        "email": existing_user["email"],
        "role": existing_user.get("role", "user"),
    })

    vehicle = await db.vehicles.find_one(
        {"user_email": existing_user["email"]},
        {"_id": 0, "vehicle_number": 1},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "full_name": existing_user["full_name"],
            "email": existing_user["email"],
            "phone": existing_user.get("phone", ""),
            "role": existing_user.get("role", "user"),
            "vehicle": vehicle.get("vehicle_number", "") if vehicle else "",
        },
    }


@router.get("/me")
async def get_current_user(payload=Depends(JWTBearer())):
    user = await db.users.find_one({"email": payload["email"]}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    vehicle = await db.vehicles.find_one(
        {"user_email": payload["email"]},
        {"_id": 0, "vehicle_number": 1},
    )
    user["_id"] = str(user["_id"])
    user["vehicle"] = vehicle.get("vehicle_number", "") if vehicle else ""
    return user


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(100000, 999999))
    await db.password_otps.delete_many({"email": data.email})
    await db.password_otps.insert_one({
        "email": data.email,
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
    })

    await send_email(
        data.email,
        "🔐 ParkSmart Password Reset OTP",
        f"Hello,\n\nYour ParkSmart password reset OTP is {otp}.\n\nIt is valid for 10 minutes.\n\nParkSmart Team",
    )
    return {"message": "OTP sent successfully."}


@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    record = await db.password_otps.find_one({"email": data.email, "otp": data.otp})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record["expires_at"] < datetime.utcnow():
        await db.password_otps.delete_one({"_id": record["_id"]})
        raise HTTPException(status_code=400, detail="OTP has expired")
    return {"message": "OTP verified successfully."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    record = await db.password_otps.find_one({"email": data.email, "otp": data.otp})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record["expires_at"] < datetime.utcnow():
        await db.password_otps.delete_one({"_id": record["_id"]})
        raise HTTPException(status_code=400, detail="OTP has expired")

    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password": hash_password(data.new_password)}},
    )
    await db.password_otps.delete_one({"_id": record["_id"]})

    await send_email(
        data.email,
        "✅ ParkSmart Password Changed",
        f"Hello {user['full_name']},\n\nYour ParkSmart password was changed successfully.\n\nParkSmart Team",
    )
    return {"message": "Password reset successfully."}
=======
# ===========================
# REGISTER
# ===========================

@router.post("/register")
async def register(user: UserCreate):
    try:
        existing_user = await db.users.find_one({"email": user.email})

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        new_user = {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "password": hash_password(user.password),
            "role": "user"
        }

        await db.users.insert_one(new_user)

        return {
            "message": "User Registered Successfully"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# LOGIN
# ===========================

@router.post("/login")
async def login(user: UserLogin):
    try:
        existing_user = await db.users.find_one(
            {"email": user.email}
        )

        if not existing_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid Email or Password"
            )

        if not verify_password(
            user.password,
            existing_user["password"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid Email or Password"
            )
            print("Role from DB:", repr(existing_user["role"]))


        access_token = create_access_token(
            {
                "email": existing_user["email"],
                "role": existing_user["role"]
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "full_name": existing_user["full_name"],
                "email": existing_user["email"],
                "phone": existing_user["phone"],
                "role": existing_user["role"]
            }
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# GET CURRENT USER
# ===========================

@router.get("/me")
async def get_current_user(payload=Depends(JWTBearer())):
    try:
        email = payload["email"]

        user = await db.users.find_one(
            {"email": email},
            {"password": 0}
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        user["_id"] = str(user["_id"])

        return user

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
