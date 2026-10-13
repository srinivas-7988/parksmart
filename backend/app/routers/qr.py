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
from app.services.email_service import send_email

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

    if not ObjectId.is_valid(booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID."
        )

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

    if booking["status"] not in ["CONFIRMED", "ACTIVE"]:
        raise HTTPException(
            status_code=400,
            detail="Booking is not active or confirmed."
        )

    qr_data = {
        "booking_id": booking_id,
        "user_email": booking["user_email"],
        "vehicle_number": booking["vehicle_number"],
        "slot_number": booking["slot_number"],
        "location": booking.get("location", "Bangalore"),
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

    # ==========================================
    # SEND QR EMAIL (Background safe)
    # ==========================================

    try:
        await send_email(
            to_email=booking["user_email"],
            subject="🎟 ParkSmart QR Code",
            body=f"""
Hello,

Your QR Code has been generated successfully.

==================================

Booking ID : {booking_id}
Vehicle Number : {booking['vehicle_number']}
Parking Slot : {booking['slot_number']}
Location : {booking.get('location', 'Bangalore')}
Booking Time : {booking['booking_time']}
Status : {booking['status']}

==================================

Your QR Code is attached to this email.
Please show this QR Code at the parking entrance.

Thank you for choosing ParkSmart.
🚗 ParkSmart Team
""",
            attachment=filepath
        )
    except Exception as email_err:
        print("[Email Notice] Could not send QR email:", email_err)

    return {
        "message": "QR Code Generated",
        "file": filename,
        "qr_url": f"/api/qr/my/{booking_id}"
    }


# ==========================================
# VIEW MY QR CODE
# ==========================================

@router.get("/my/{booking_id}")
async def my_qr(
    booking_id: str,
    payload=Depends(JWTBearer())
):

    if not ObjectId.is_valid(booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID."
        )

    # Check booking ownership
    booking = await db.bookings.find_one({
        "_id": ObjectId(booking_id),
        "user_email": payload["email"]
    })

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found or unauthorized."
        )

    filename = f"{booking_id}.png"
    filepath = os.path.join(QR_FOLDER, filename)

    if not os.path.exists(filepath):
        qr_data = {
            "booking_id": booking_id,
            "user_email": booking["user_email"],
            "vehicle_number": booking["vehicle_number"],
            "slot_number": booking["slot_number"],
            "location": booking.get("location", "Bangalore"),
            "booking_time": str(booking["booking_time"])
        }
        img = qrcode.make(json.dumps(qr_data))
        img.save(filepath)

    return FileResponse(filepath, media_type="image/png")


# ==========================================
# VERIFY QR (STAFF / GUARD / ADMIN)
# ==========================================

@router.post("/verify/{booking_id}")
async def verify_qr(
    booking_id: str,
    payload=Depends(JWTBearer())
):
    query = {}
    clean_id = booking_id.strip()

    if ObjectId.is_valid(clean_id):
        query["_id"] = ObjectId(clean_id)
    else:
        query["slot_number"] = clean_id.upper()

    booking = await db.bookings.find_one(query)

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found. Invalid QR code or booking ID."
        )

    return {
        "valid": True,
        "booking_id": str(booking["_id"]),
        "booking_status": booking.get("status", "CONFIRMED"),
        "slot_number": booking.get("slot_number"),
        "vehicle_number": booking.get("vehicle_number"),
        "location": booking.get("location", "Bangalore"),
        "booking_date": booking.get("booking_date"),
        "start_time": booking.get("start_time"),
        "duration": booking.get("duration"),
        "total": booking.get("total"),
        "user_email": booking.get("user_email")
    }


# ==========================================
# GATE CHECK-IN (ENTRY ALLOWED)
# ==========================================

@router.post("/check-in/{booking_id}")
async def check_in_booking(
    booking_id: str,
    payload=Depends(JWTBearer())
):
    clean_id = booking_id.strip()
    query = {"_id": ObjectId(clean_id)} if ObjectId.is_valid(clean_id) else {"slot_number": clean_id.upper()}

    booking = await db.bookings.find_one(query)
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    await db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "CHECKED_IN", "checked_in_at": datetime.utcnow()}}
    )

    # Mark slot as occupied
    await db.parking_slots.update_one(
        {"slot_number": booking["slot_number"]},
        {"$set": {"is_available": False}}
    )

    return {
        "message": "Vehicle checked in successfully. Gate opened.",
        "status": "CHECKED_IN",
        "booking_id": str(booking["_id"]),
        "slot_number": booking["slot_number"]
    }


# ==========================================
# GATE CHECK-OUT (EXIT & RELEASE SLOT)
# ==========================================

@router.post("/check-out/{booking_id}")
async def check_out_booking(
    booking_id: str,
    payload=Depends(JWTBearer())
):
    clean_id = booking_id.strip()
    query = {"_id": ObjectId(clean_id)} if ObjectId.is_valid(clean_id) else {"slot_number": clean_id.upper()}

    booking = await db.bookings.find_one(query)
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    await db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "COMPLETED", "checked_out_at": datetime.utcnow()}}
    )

    # Free up the parking slot
    await db.parking_slots.update_one(
        {"slot_number": booking["slot_number"]},
        {"$set": {"is_available": True}}
    )

    return {
        "message": "Vehicle checked out. Slot released back to available.",
        "status": "COMPLETED",
        "booking_id": str(booking["_id"]),
        "slot_number": booking["slot_number"]
    }