from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.auth.admin_bearer import AdminBearer
from app.auth.auth_bearer import JWTBearer
from app.database.database import db
from app.schemas.payment import PaymentCreate
from app.services.email_service import send_email

router = APIRouter()


def object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment or booking ID")


@router.post("/create")
async def create_payment(payment: PaymentCreate, payload=Depends(JWTBearer())):
    booking = await db.bookings.find_one({"_id": object_id(payment.booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking["user_email"] != payload["email"]:
        raise HTTPException(status_code=403, detail="Unauthorized.")
    if booking["status"] not in ("ACTIVE", "CONFIRMED"):
        raise HTTPException(status_code=400, detail="Booking cannot be paid.")

    existing = await db.payments.find_one({
        "booking_id": payment.booking_id,
        "status": "SUCCESS",
    })
    if existing:
        return {"message": "Payment already completed", "payment_id": str(existing["_id"])}

    result = await db.payments.insert_one({
        "booking_id": payment.booking_id,
        "user_email": payload["email"],
        "amount": payment.amount,
        "payment_method": "Mock Payment",
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "paid_at": None,
    })
    return {"message": "Payment Created", "payment_id": str(result.inserted_id)}


@router.post("/pay/{payment_id}")
async def pay_now(payment_id: str, payload=Depends(JWTBearer())):
    payment = await db.payments.find_one({"_id": object_id(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")
    if payment["user_email"] != payload["email"]:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    await db.payments.update_one(
        {"_id": payment["_id"]},
        {"$set": {"status": "SUCCESS", "paid_at": datetime.utcnow()}},
    )
    await db.bookings.update_one(
        {"_id": object_id(payment["booking_id"])},
        {"$set": {"status": "CONFIRMED"}},
    )

    booking = await db.bookings.find_one({"_id": object_id(payment["booking_id"])})
    if booking:
        await db.parking_slots.update_one(
            {"slot_number": booking["slot_number"]},
            {"$set": {"is_available": False}},
        )
        await send_email(
            payment["user_email"],
            "💳 ParkSmart Payment Successful",
            f"""Hello,\n\nYour payment was successful.\n\nPayment ID: {payment_id}\nBooking ID: {payment['booking_id']}\nAmount: ₹{payment['amount']}\nVehicle: {booking['vehicle_number']}\nSlot: {booking['slot_number']}\nStatus: CONFIRMED\n\nParkSmart Team""",
        )

    return {"message": "Payment Successful", "booking_status": "CONFIRMED", "slot_status": "OCCUPIED"}


@router.get("/history")
async def payment_history(payload=Depends(JWTBearer())):
    payments = await db.payments.find({"user_email": payload["email"]}).sort("created_at", -1).to_list(None)
    for payment in payments:
        payment["_id"] = str(payment["_id"])
    return payments


@router.get("/admin")
async def payment_dashboard(payload=Depends(AdminBearer())):
    total = await db.payments.count_documents({})
    successful = await db.payments.count_documents({"status": "SUCCESS"})
    pending = await db.payments.count_documents({"status": "PENDING"})
    revenue = 0
    async for payment in db.payments.find({"status": "SUCCESS"}):
        revenue += payment.get("amount", 0)
    return {
        "total_payments": total,
        "successful_payments": successful,
        "pending_payments": pending,
        "total_revenue": revenue,
    }
