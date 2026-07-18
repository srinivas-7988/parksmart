from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database.database import db
from app.schemas.booking import BookingCreate
from app.auth.auth_bearer import JWTBearer

router = APIRouter()


# ===========================
# CREATE BOOKING
# ===========================

@router.post("/")
async def create_booking(
    booking: BookingCreate,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    # Check vehicle ownership
    vehicle = await db.vehicles.find_one(
        {
            "vehicle_number": booking.vehicle_number.upper(),
            "user_email": user_email
        }
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    # Check slot availability
    slot = await db.parking_slots.find_one(
        {
            "slot_number": booking.slot_number.upper(),
            "is_available": True
        }
    )

    if not slot:
        raise HTTPException(
            status_code=400,
            detail="Parking slot not available."
        )

    # Prevent multiple active bookings
    active_booking = await db.bookings.find_one(
        {
            "user_email": user_email,
            "status": "ACTIVE"
        }
    )

    if active_booking:
        raise HTTPException(
            status_code=400,
            detail="You already have an active booking."
        )

    # Create booking
    new_booking = {
        "user_email": user_email,
        "vehicle_number": booking.vehicle_number.upper(),
        "slot_number": booking.slot_number.upper(),
        "booking_time": datetime.utcnow(),
        "status": "ACTIVE"
    }

    result = await db.bookings.insert_one(new_booking)

    # Mark slot as occupied
    await db.parking_slots.update_one(
        {
            "slot_number": booking.slot_number.upper()
        },
        {
            "$set": {
                "is_available": False
            }
        }
    )

    return {
        "message": "Booking created successfully",
        "booking_id": str(result.inserted_id)
    }
    # ===========================
# GET MY BOOKINGS
# ===========================

@router.get("/")
async def get_my_bookings(
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    bookings = await db.bookings.find(
        {
            "user_email": user_email
        },
        {
            "_id": 0
        }
    ).sort("booking_time", -1).to_list(length=None)

    return {
        "total": len(bookings),
        "bookings": bookings
    }
    # ===========================
# CANCEL BOOKING
# ===========================

@router.delete("/{slot_number}")
async def cancel_booking(
    slot_number: str,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    booking = await db.bookings.find_one(
        {
            "slot_number": slot_number.upper(),
            "user_email": user_email,
            "status": "ACTIVE"
        }
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Active booking not found."
        )

    await db.bookings.update_one(
        {
            "_id": booking["_id"]
        },
        {
            "$set": {
                "status": "CANCELLED"
            }
        }
    )

    await db.parking_slots.update_one(
        {
            "slot_number": slot_number.upper()
        },
        {
            "$set": {
                "is_available": True
            }
        }
    )

    return {
        "message": "Booking cancelled successfully"
    }