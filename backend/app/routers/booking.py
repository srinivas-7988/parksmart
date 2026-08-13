<<<<<<< HEAD
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth.auth_bearer import JWTBearer
from app.database.database import db
from app.schemas.booking import BookingCreate
from app.services.email_service import send_email
=======
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database.database import db
from app.schemas.booking import BookingCreate
from app.auth.auth_bearer import JWTBearer
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f

router = APIRouter()


<<<<<<< HEAD
@router.post("/")
async def create_booking(booking: BookingCreate, payload=Depends(JWTBearer())):
    user_email = payload["email"]
    vehicle_number = booking.vehicle_number.strip().upper()
    slot_number = booking.slot_number.strip().upper()

    vehicle = await db.vehicles.find_one({
        "vehicle_number": vehicle_number,
        "user_email": user_email,
    })
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found. Add your vehicle first.")

    slot = await db.parking_slots.find_one({
        "slot_number": slot_number,
        "is_available": True,
    })
    if not slot:
        raise HTTPException(status_code=400, detail="Parking slot not available.")

    active_booking = await db.bookings.find_one({
        "user_email": user_email,
        "status": {"$in": ["ACTIVE", "CONFIRMED"]},
    })
    if active_booking:
        raise HTTPException(status_code=400, detail="You already have an active booking.")

    booking_time = datetime.utcnow()
    new_booking = {
        "user_email": user_email,
        "vehicle_number": vehicle_number,
        "slot_number": slot_number,
        "location": booking.location,
        "booking_date": booking.booking_date,
        "duration": booking.duration,
        "start_time": booking.start_time,
        "booking_time": booking_time,
        "status": "ACTIVE",
    }

    result = await db.bookings.insert_one(new_booking)
    await db.parking_slots.update_one(
        {"slot_number": slot_number},
        {"$set": {"is_available": False}},
    )

    await send_email(
        user_email,
        "🚗 ParkSmart Booking Created",
        f"""Hello,\n\nYour parking booking has been created.\n\nBooking ID: {result.inserted_id}\nVehicle: {vehicle_number}\nSlot: {slot_number}\nLocation: {booking.location or '-'}\nStatus: ACTIVE\n\nComplete payment to confirm the booking.\n\nParkSmart Team""",
=======
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
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
    )

    return {
        "message": "Booking created successfully",
<<<<<<< HEAD
        "booking_id": str(result.inserted_id),
    }


@router.get("/")
async def get_my_bookings(payload=Depends(JWTBearer())):
    bookings = await db.bookings.find(
        {"user_email": payload["email"]},
        {"_id": 1, "user_email": 1, "vehicle_number": 1, "slot_number": 1,
         "location": 1, "booking_date": 1, "duration": 1, "start_time": 1,
         "booking_time": 1, "status": 1},
    ).sort("booking_time", -1).to_list(length=None)

    for booking in bookings:
        booking["_id"] = str(booking["_id"])
        if isinstance(booking.get("booking_time"), datetime):
            booking["booking_time"] = booking["booking_time"].isoformat()

    return {"total": len(bookings), "bookings": bookings}


@router.delete("/{slot_number}")
async def cancel_booking(slot_number: str, payload=Depends(JWTBearer())):
    slot_number = slot_number.upper()
    booking = await db.bookings.find_one({
        "slot_number": slot_number,
        "user_email": payload["email"],
        "status": {"$in": ["ACTIVE", "CONFIRMED"]},
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Active booking not found.")

    await db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"status": "CANCELLED"}},
    )
    await db.parking_slots.update_one(
        {"slot_number": slot_number},
        {"$set": {"is_available": True}},
    )
    return {"message": "Booking cancelled successfully"}


@router.post("/{booking_id}/arrive")
async def confirm_arrival(booking_id: str, payload=Depends(JWTBearer())):
    from bson import ObjectId

    try:
        oid = ObjectId(booking_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")

    booking = await db.bookings.find_one({"_id": oid, "user_email": payload["email"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ("ACTIVE", "CONFIRMED"):
        raise HTTPException(status_code=400, detail="Booking cannot be marked as arrived")

    await db.bookings.update_one({"_id": oid}, {"$set": {"status": "COMPLETED"}})
    return {"message": "Arrival confirmed", "status": "COMPLETED"}
=======
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
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
