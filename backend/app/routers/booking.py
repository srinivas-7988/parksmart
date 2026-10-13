from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
import re

from app.database.database import db
from app.schemas.booking import BookingCreate
from app.auth.auth_bearer import JWTBearer
from app.services.email_service import send_email

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
        # If user has this vehicle registered or can auto-register
        existing = await db.vehicles.find_one({
            "vehicle_number": booking.vehicle_number.upper()
        })
        if not existing:
            await db.vehicles.insert_one({
                "user_email": user_email,
                "vehicle_number": booking.vehicle_number.upper(),
                "vehicle_type": "CAR",
                "created_at": datetime.utcnow()
            })
        else:
            raise HTTPException(
                status_code=404,
                detail="Vehicle belongs to another user."
            )

    # Check slot availability for specific location
    loc_filter = {"$regex": f"^{re.escape(booking.location)}$", "$options": "i"} if booking.location else None
    slot_query = {
        "slot_number": booking.slot_number.upper(),
        "is_available": True
    }
    if loc_filter:
        slot_query["location"] = loc_filter

    slot = await db.parking_slots.find_one(slot_query)

    if not slot:
        # Try finding by slot number if location wasn't an exact match
        slot = await db.parking_slots.find_one({
            "slot_number": booking.slot_number.upper(),
            "is_available": True
        })

    if not slot:
        raise HTTPException(
            status_code=400,
            detail="Parking slot is not available."
        )

    # Prevent multiple active bookings for same user
    active_booking = await db.bookings.find_one(
        {
            "user_email": user_email,
            "status": "ACTIVE"
        }
    )

    if active_booking:
        raise HTTPException(
            status_code=400,
            detail="You already have an active booking. Please complete or cancel it first."
        )

    # Create booking
    new_booking = {
        "user_email": user_email,
        "vehicle_number": booking.vehicle_number.upper(),
        "slot_number": booking.slot_number.upper(),
        "location": booking.location or slot.get("location", "Brigade Road"),
        "booking_date": booking.booking_date,
        "start_time": booking.start_time,
        "duration": booking.duration,
        "total": booking.total,
        "booking_time": datetime.utcnow(),
        "status": "ACTIVE"
    }

    result = await db.bookings.insert_one(new_booking)

    # Mark slot as occupied
    await db.parking_slots.update_one(
        {
            "slot_number": booking.slot_number.upper(),
            "location": new_booking["location"]
        },
        {
            "$set": {
                "is_available": False
            }
        }
    )

    # Send Booking Confirmation Email (async background task, safe)
    try:
        await send_email(
            to_email=user_email,
            subject="🚗 ParkSmart Booking Confirmation",
            body=f"""
Hello,

Your parking slot has been booked successfully.

============================

Booking ID : {result.inserted_id}
Vehicle Number : {booking.vehicle_number.upper()}
Parking Slot : {booking.slot_number.upper()}
Location : {new_booking['location']}
Booking Date : {booking.booking_date}
Start Time : {booking.start_time}
Duration : {booking.duration} hr(s)
Total : ₹{booking.total}
Status : ACTIVE

============================

Thank you for choosing ParkSmart.
Happy Parking!

- ParkSmart Team
"""
        )
    except Exception as email_err:
        print("[Email Notice] Could not send confirmation email:", email_err)

    return {
        "message": "Booking created successfully",
        "booking_id": str(result.inserted_id),
        "id": str(result.inserted_id),
        "status": "ACTIVE"
    }


from app.services.refund_service import process_booking_refund, check_and_process_no_shows


# ===========================
# CHECK NO-SHOWS
# ===========================

@router.post("/check-no-shows")
async def trigger_no_show_check():
    """
    Scans for bookings whose 30-minute grace period has passed without check-in,
    deducts 20% penalty, refunds 80%, and releases the slot.
    """
    processed = await check_and_process_no_shows()
    return {
        "message": f"Processed {len(processed)} no-show booking(s)",
        "processed_count": len(processed),
        "results": processed
    }


# ===========================
# GET MY BOOKINGS
# ===========================

@router.get("/")
async def get_my_bookings(
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    # Check and expire any overdue bookings in real-time
    try:
        await check_and_process_no_shows()
    except Exception as e:
        print("[No-Show Check Error]", e)

    bookings = await db.bookings.find(
        {
            "user_email": user_email
        }
    ).sort("booking_time", -1).to_list(length=None)

    for b in bookings:
        b_id = str(b.pop("_id", ""))
        b["id"] = b_id
        b["booking_id"] = b_id

    return {
        "total": len(bookings),
        "bookings": bookings
    }


# ===========================
# CANCEL BOOKING
# ===========================

@router.delete("/{slot_or_id}")
async def cancel_booking(
    slot_or_id: str,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    query = {
        "user_email": user_email,
        "status": {"$in": ["ACTIVE", "CONFIRMED"]}
    }

    if ObjectId.is_valid(slot_or_id):
        query["_id"] = ObjectId(slot_or_id)
    else:
        query["slot_number"] = slot_or_id.upper()

    booking = await db.bookings.find_one(query)

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Active or confirmed booking not found."
        )

    # Process 20% penalty deduction and 80% refund
    refund_res = await process_booking_refund(booking, reason="USER_CANCELLATION")

    return {
        "message": "Booking cancelled successfully. 80% refund initiated.",
        "status": "CANCELLED",
        "booking_id": refund_res["booking_id"],
        "penalty_amount": refund_res["penalty_amount"],
        "refund_amount": refund_res["refund_amount"],
        "refund_status": refund_res["refund_status"],
        "refund_id": refund_res["refund_id"]
    }