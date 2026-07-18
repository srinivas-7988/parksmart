from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from bson import ObjectId
from datetime import datetime
import qrcode
import json
import os

from app.database.database import db
from app.auth.auth_bearer import JWTBearer
from app.auth.admin_bearer import AdminBearer

router = APIRouter()

QR_FOLDER = "qrcodes"

os.makedirs(QR_FOLDER, exist_ok=True)


# ==========================================
# GENERATE QR CODE
# ==========================================

@router.post("/generate/{booking_id}")
async def generate_qr(
    booking_id: str,
    payload=Depends(JWTBearer())
):

    booking = await db.bookings.find_one(
        {
            "_id": ObjectId(booking_id)
        }
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    if booking["user_email"] != payload["email"]:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized."
        )

    if booking["status"] != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Booking is not confirmed."
        )

    qr_data = {
        "booking_id": booking_id,
        "user_email": booking["user_email"],
        "vehicle_number": booking["vehicle_number"],
        "slot_number": booking["slot_number"],
        "booking_time": str(booking["booking_time"])
    }

    filename = f"{booking_id}.png"
    filepath = os.path.join(QR_FOLDER, filename)

    img = qrcode.make(json.dumps(qr_data))
    img.save(filepath)

    existing = await db.qr_codes.find_one(
        {
            "booking_id": booking_id
        }
    )

    if not existing:
        await db.qr_codes.insert_one(
            {
                "booking_id": booking_id,
                "user_email": booking["user_email"],
                "vehicle_number": booking["vehicle_number"],
                "slot_number": booking["slot_number"],
                "qr_path": filepath,
                "created_at": datetime.utcnow()
            }
        )

    return {
        "message": "QR Code Generated",
        "file": filename
    }


# ==========================================
# VIEW MY QR CODE
# ==========================================

@router.get("/my/{booking_id}")
async def my_qr(
    booking_id: str,
    payload=Depends(JWTBearer())
):

    qr = await db.qr_codes.find_one(
        {
            "booking_id": booking_id,
            "user_email": payload["email"]
        }
    )

    if not qr:
        raise HTTPException(
            status_code=404,
            detail="QR Code not found."
        )

    return FileResponse(qr["qr_path"])


# ==========================================
# VERIFY QR (ADMIN)
# ==========================================

@router.post("/verify/{booking_id}")
async def verify_qr(
    booking_id: str,
    payload=Depends(AdminBearer())
):

    booking = await db.bookings.find_one(
        {
            "_id": ObjectId(booking_id)
        }
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    return {
        "valid": True,
        "booking_status": booking["status"],
        "slot_number": booking["slot_number"],
        "vehicle_number": booking["vehicle_number"],
        "user_email": booking["user_email"]
    }