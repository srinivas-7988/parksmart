from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from app.database.database import db
from app.auth.auth_bearer import JWTBearer
from app.auth.admin_bearer import AdminBearer
from app.schemas.payment import PaymentCreate

router = APIRouter()


# ==========================================
# CREATE PAYMENT
# ==========================================

@router.post("/create")
async def create_payment(
    payment: PaymentCreate,
    payload=Depends(JWTBearer())
):

    booking = await db.bookings.find_one(
        {
            "_id": ObjectId(payment.booking_id)
        }
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    new_payment = {
        "booking_id": payment.booking_id,
        "user_email": payload["email"],
        "amount": payment.amount,
        "payment_method": "Mock Payment",
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "paid_at": None
    }

    result = await db.payments.insert_one(new_payment)

    return {
        "message": "Payment Created",
        "payment_id": str(result.inserted_id)
    }


# ==========================================
# PAY NOW (MOCK)
# ==========================================

@router.post("/pay/{payment_id}")
async def pay_now(
    payment_id: str,
    payload=Depends(JWTBearer())
):

    payment = await db.payments.find_one(
        {
            "_id": ObjectId(payment_id)
        }
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found."
        )

    # Update payment status
    await db.payments.update_one(
        {
            "_id": ObjectId(payment_id)
        },
        {
            "$set": {
                "status": "SUCCESS",
                "paid_at": datetime.utcnow()
            }
        }
    )

    # Update booking status
    await db.bookings.update_one(
        {
            "_id": ObjectId(payment["booking_id"])
        },
        {
            "$set": {
                "status": "CONFIRMED"
            }
        }
    )

    # Get booking details
    booking = await db.bookings.find_one(
        {
            "_id": ObjectId(payment["booking_id"])
        }
    )

    # Mark parking slot as occupied
    await db.parking_slots.update_one(
        {
            "slot_number": booking["slot_number"]
        },
        {
            "$set": {
                "is_available": False
            }
        }
    )

    return {
        "message": "Payment Successful",
        "booking_status": "CONFIRMED",
        "slot_status": "OCCUPIED"
    }
# ==========================================
# MY PAYMENT HISTORY
# ==========================================

@router.get("/history")
async def payment_history(
    payload=Depends(JWTBearer())
):

    payments = await db.payments.find(
        {
            "user_email": payload["email"]
        }
    ).to_list(None)

    for payment in payments:
        payment["_id"] = str(payment["_id"])

    return payments


# ==========================================
# ADMIN PAYMENT DASHBOARD
# ==========================================

@router.get("/admin")
async def payment_dashboard(
    payload=Depends(AdminBearer())
):

    total_payments = await db.payments.count_documents({})

    successful = await db.payments.count_documents(
        {
            "status": "SUCCESS"
        }
    )

    pending = await db.payments.count_documents(
        {
            "status": "PENDING"
        }
    )

    revenue = 0

    cursor = db.payments.find(
        {
            "status": "SUCCESS"
        }
    )

    async for payment in cursor:
        revenue += payment["amount"]

    return {
        "total_payments": total_payments,
        "successful_payments": successful,
        "pending_payments": pending,
        "total_revenue": revenue
    }