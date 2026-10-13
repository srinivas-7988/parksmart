from fastapi import APIRouter, HTTPException, Depends
from app.database.database import db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    PhoneOTPRequest,
    VerifyPhoneOTPRequest
)
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.auth_bearer import JWTBearer
from app.services.email_service import send_email
from app.services.sms_service import send_sms_otp

import traceback
import random
from datetime import datetime, timedelta

router = APIRouter()


# ===========================
# REGISTER
# ===========================

@router.post("/register")
async def register(user: UserCreate):
    try:

        existing_user = await db.users.find_one({
            "email": user.email
        })

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        v_num = user.vehicle_number.strip().upper() if user.vehicle_number and user.vehicle_number.strip() else None

        new_user = {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "password": hash_password(user.password),
            "role": "user",
            "vehicle_number": v_num,
            "created_at": datetime.utcnow()
        }

        await db.users.insert_one(new_user)

        # Register vehicle into vehicles collection so it immediately appears in Profile and Booking
        if v_num:
            await db.vehicles.update_one(
                {"vehicle_number": v_num},
                {
                    "$set": {
                        "user_email": user.email,
                        "vehicle_number": v_num,
                        "vehicle_type": "CAR",
                        "brand": "Standard",
                        "model": "Car",
                        "color": "Default",
                        "updated_at": datetime.utcnow()
                    },
                    "$setOnInsert": {
                        "created_at": datetime.utcnow()
                    }
                },
                upsert=True
            )

        # Send welcome email (safe background execution)
        try:
            await send_email(
                to_email=user.email,
                subject="Welcome to ParkSmart 🚗",
                body=f"""
Hello {user.full_name},

Welcome to ParkSmart!

Your account has been created successfully.

You can now:

✔ Book Parking Slots
✔ Make Payments
✔ Generate QR Codes
✔ View Booking History

Thank you for choosing ParkSmart.

Happy Parking!

🚗 ParkSmart Team
"""
            )
        except Exception as email_err:
            print(f"[Email Notice] Welcome email could not be sent to {user.email}: {email_err}")

        return {
            "message": "User Registered Successfully"
        }

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ===========================
# LOGIN
# ===========================

@router.post("/login")
async def login(user: UserLogin):

    existing_user = await db.users.find_one({
        "email": user.email
    })

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

    access_token = create_access_token({
        "email": existing_user["email"],
        "role": existing_user["role"]
    })

    # Look up registered vehicle for this user
    user_vehicle = await db.vehicles.find_one({"user_email": existing_user["email"]})
    v_num = user_vehicle.get("vehicle_number") if user_vehicle else existing_user.get("vehicle_number", "")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "full_name": existing_user["full_name"],
            "email": existing_user["email"],
            "phone": existing_user["phone"],
            "role": existing_user["role"],
            "vehicle": v_num,
            "vehicle_number": v_num
        }
    }


# ===========================
# PHONE OTP LOGIN
# ===========================

@router.post("/send-phone-otp")
async def send_phone_otp(data: PhoneOTPRequest):
    raw_phone = data.phone.strip()
    clean_digits = "".join(filter(str.isdigit, raw_phone))
    phone_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits

    if len(phone_10) < 10:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid 10-digit mobile number."
        )

    otp = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=5)

    # Delete previous OTPs for this 10-digit phone
    await db.phone_otps.delete_many({
        "phone_10": phone_10
    })

    # Store new OTP keyed by 10-digit phone
    await db.phone_otps.insert_one({
        "phone": raw_phone,
        "phone_10": phone_10,
        "otp": otp,
        "expires_at": expiry
    })

    # Send real SMS via Fast2SMS / Twilio
    try:
        await send_sms_otp(phone=phone_10, otp=otp)
    except Exception as sms_err:
        print(f"[SMS Dispatch Notice] {sms_err}")

    return {
        "message": f"OTP sent to +91 {phone_10}",
        "dev_otp": otp
    }


# ===========================
# VERIFY PHONE OTP
# ===========================

@router.post("/verify-phone-otp")
async def verify_phone_otp(data: VerifyPhoneOTPRequest):
    raw_phone = data.phone.strip()
    clean_digits = "".join(filter(str.isdigit, raw_phone))
    phone_10 = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
    otp = data.otp.strip()

    # Find OTP by phone_10 or raw phone
    otp_record = await db.phone_otps.find_one({
        "$or": [
            {"phone_10": phone_10, "otp": otp},
            {"phone": raw_phone, "otp": otp}
        ]
    })

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP. Please check the code."
        )

    if otp_record["expires_at"] < datetime.utcnow():
        await db.phone_otps.delete_one({
            "_id": otp_record["_id"]
        })
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new one."
        )

    # Find existing user by phone suffix
    user = await db.users.find_one({
        "phone": {"$regex": f"{phone_10}$"}
    })

    # Auto-register driver if logging in with phone for first time
    if not user:
        user = {
            "full_name": f"Driver {phone_10[-4:]}",
            "email": f"driver_{phone_10}@parksmart.in",
            "phone": f"+91 {phone_10}",
            "password": hash_password(otp + "parksmart"),
            "role": "user",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(user)

        # Register default vehicle
        await db.vehicles.insert_one({
            "user_email": user["email"],
            "vehicle_number": f"KA 01 P {phone_10[-4:]}",
            "vehicle_type": "CAR",
            "brand": "Standard",
            "model": "Car",
            "color": "White",
            "created_at": datetime.utcnow()
        })

    # Delete OTP after successful verification
    await db.phone_otps.delete_one({
        "_id": otp_record["_id"]
    })

    # Create JWT token
    access_token = create_access_token({
        "email": user["email"],
        "role": user.get("role", "user")
    })

    # Look up registered vehicle for this user
    user_vehicle = await db.vehicles.find_one({"user_email": user["email"]})
    v_num = user_vehicle.get("vehicle_number") if user_vehicle else user.get("vehicle_number", "")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "full_name": user.get("full_name", "Driver"),
            "email": user.get("email"),
            "phone": user.get("phone", f"+91 {phone_10}"),
            "role": user.get("role", "user"),
            "vehicle": v_num,
            "vehicle_number": v_num
        }
    }


# ===========================
# CURRENT USER
# ===========================

@router.get("/me")
async def get_current_user(
    payload=Depends(JWTBearer())
):

    user = await db.users.find_one(
        {
            "email": payload["email"]
        },
        {
            "password": 0
        }
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user["_id"] = str(user["_id"])
    user_vehicle = await db.vehicles.find_one({"user_email": payload["email"]})
    v_num = user_vehicle.get("vehicle_number") if user_vehicle else user.get("vehicle_number", "")
    user["vehicle"] = v_num
    user["vehicle_number"] = v_num

    return user


# ===========================
# FORGOT PASSWORD
# ===========================

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest
):

    user = await db.users.find_one({
        "email": data.email
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    otp = str(random.randint(100000, 999999))

    expiry = datetime.utcnow() + timedelta(minutes=10)

    await db.password_otps.delete_many({
        "email": data.email
    })

    await db.password_otps.insert_one({
        "email": data.email,
        "otp": otp,
        "expires_at": expiry
    })

    await send_email(
        to_email=data.email,
        subject="🔐 ParkSmart Password Reset OTP",
        body=f"""
Hello,

Your OTP is:

{otp}

This OTP is valid for 10 minutes.

If you didn't request this,
please ignore this email.

🚗 ParkSmart Team
"""
    )

    return {
        "message": "OTP sent successfully."
    }


# ===========================
# VERIFY EMAIL OTP
# ===========================

@router.post("/verify-otp")
async def verify_otp(
    data: VerifyOTPRequest
):

    otp_record = await db.password_otps.find_one({
        "email": data.email,
        "otp": data.otp
    })

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    if otp_record["expires_at"] < datetime.utcnow():

        await db.password_otps.delete_one({
            "_id": otp_record["_id"]
        })

        raise HTTPException(
            status_code=400,
            detail="OTP has expired"
        )

    return {
        "message": "OTP verified successfully."
    }


# ===========================
# RESET PASSWORD
# ===========================

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest
):

    otp_record = await db.password_otps.find_one({
        "email": data.email,
        "otp": data.otp
    })

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    if otp_record["expires_at"] < datetime.utcnow():

        await db.password_otps.delete_one({
            "_id": otp_record["_id"]
        })

        raise HTTPException(
            status_code=400,
            detail="OTP has expired"
        )

    user = await db.users.find_one({
        "email": data.email
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    await db.users.update_one(
        {
            "email": data.email
        },
        {
            "$set": {
                "password": hash_password(
                    data.new_password
                )
            }
        }
    )

    await db.password_otps.delete_one({
        "_id": otp_record["_id"]
    })

    try:
        await send_email(
            to_email=data.email,
            subject="✅ ParkSmart Password Changed Successfully",
            body=f"""
Hello {user['full_name']},

Your ParkSmart password has been changed successfully.

Account: {data.email}

Time: {datetime.utcnow()}

If you did NOT make this change,
please contact the administrator.

Thank you for using ParkSmart.

🚗 ParkSmart Team
"""
        )
    except Exception as email_err:
        print(f"[Email Notice] Password change notification could not be sent to {data.email}: {email_err}")

    return {
        "message": "Password reset successfully."
    }