from fastapi import APIRouter, Depends

from app.database.database import db
from app.auth.admin_bearer import AdminBearer
from app.auth.auth_bearer import JWTBearer

router = APIRouter()


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@router.get("/admin")
async def admin_dashboard(
    payload=Depends(JWTBearer())
):

    total_users = await db.users.count_documents({})

    total_vehicles = await db.vehicles.count_documents({})

    total_slots = await db.parking_slots.count_documents({})

    available_slots = await db.parking_slots.count_documents(
        {
            "is_available": True
        }
    )

    occupied_slots = await db.parking_slots.count_documents(
        {
            "is_available": False
        }
    )

    active_bookings = await db.bookings.count_documents(
        {
            "status": {"$in": ["ACTIVE", "CONFIRMED", "CHECKED_IN"]}
        }
    )

    completed_bookings = await db.bookings.count_documents(
        {
            "status": "COMPLETED"
        }
    )

    cancelled_bookings = await db.bookings.count_documents(
        {
            "status": "CANCELLED"
        }
    )

    # Calculate total revenue
    all_payments = await db.payments.find({"status": "SUCCESS"}).to_list(length=None)
    total_revenue = sum(float(p.get("amount", 0)) for p in all_payments) if all_payments else 0
    if total_revenue == 0:
        bookings = await db.bookings.find(
            {"status": {"$in": ["ACTIVE", "CONFIRMED", "CHECKED_IN", "COMPLETED"]}}
        ).to_list(length=None)
        total_revenue = sum(float(b.get("total", 0)) for b in bookings)

    return {
        "total_users": total_users,
        "total_vehicles": total_vehicles,
        "total_parking_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "active_bookings": active_bookings,
        "completed_bookings": completed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "total_revenue": total_revenue
    }


# ==========================================
# USER DASHBOARD
# ==========================================

@router.get("/user")
async def user_dashboard(
    payload=Depends(JWTBearer())
):

    email = payload["email"]

    my_vehicles = await db.vehicles.count_documents(
        {
            "user_email": email
        }
    )

    active_booking = await db.bookings.count_documents(
        {
            "user_email": email,
            "status": "ACTIVE"
        }
    )

    total_bookings = await db.bookings.count_documents(
        {
            "user_email": email
        }
    )

    cancelled_bookings = await db.bookings.count_documents(
        {
            "user_email": email,
            "status": "CANCELLED"
        }
    )

    return {
        "my_vehicles": my_vehicles,
        "active_booking": active_booking,
        "total_bookings": total_bookings,
        "cancelled_bookings": cancelled_bookings
    }