from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
import os
import logging
import razorpay
from dotenv import load_dotenv

load_dotenv()

from app.database.database import db
from app.auth.auth_bearer import JWTBearer
from app.auth.admin_bearer import AdminBearer
from app.schemas.payment import (
    PaymentCreate,
    RazorpayOrderCreate,
    RazorpayVerifyPayment,
)
from app.services.email_service import send_email

router = APIRouter()
logger = logging.getLogger(__name__)


def get_razorpay_keys():
    key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_parksmart_demo")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "parksmart_secret_demo")
    return key_id, key_secret


def get_razorpay_client():
    """Initializes and returns the Razorpay client if keys are available."""
    key_id, key_secret = get_razorpay_keys()
    try:
        return razorpay.Client(auth=(key_id, key_secret))
    except Exception as e:
        logger.warning(f"Could not initialize Razorpay client: {e}")
        return None



# ==========================================
# RAZORPAY CONFIG
# ==========================================

@router.get("/razorpay/config")
async def get_razorpay_config():
    """Returns the public Razorpay Key ID for frontend checkout initialization."""
    key_id, _ = get_razorpay_keys()
    return {
        "key_id": key_id,
        "currency": "INR"
    }


# ==========================================
# RAZORPAY CREATE ORDER
# ==========================================

@router.post("/razorpay/create-order")
async def create_razorpay_order(
    order_data: RazorpayOrderCreate,
    payload=Depends(JWTBearer())
):
    """
    Creates a Razorpay Order for a booking.
    Falls back gracefully to simulated order if in demo mode or keys are test placeholders.
    """
    booking_id = order_data.booking_id
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID."
        )

    booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found."
        )

    amount_in_paise = int(round(order_data.amount * 100))
    currency = order_data.currency or "INR"
    client = get_razorpay_client()
    key_id, _ = get_razorpay_keys()
    order_id = None
    is_simulated = False

    # Try live/test Razorpay API if client and real keys are present
    if client and not key_id.endswith("_demo"):
        try:
            rzp_order = client.order.create({
                "amount": amount_in_paise,
                "currency": currency,
                "receipt": f"rcpt_{booking_id[-8:]}",
                "notes": {
                    "booking_id": booking_id,
                    "user_email": payload.get("email", ""),
                }
            })
            order_id = rzp_order.get("id")
        except Exception as err:
            logger.warning(f"Razorpay API order creation failed, falling back to simulated order: {err}")

    # Fallback to demo order ID for development and testing
    if not order_id:
        order_id = f"order_demo_{str(ObjectId())}"
        is_simulated = True

    # Record or update pending payment in database
    payment_record = {
        "booking_id": booking_id,
        "user_email": payload["email"],
        "amount": order_data.amount,
        "currency": currency,
        "payment_method": "Razorpay",
        "razorpay_order_id": order_id,
        "status": "PENDING",
        "is_simulated": is_simulated,
        "created_at": datetime.utcnow(),
        "paid_at": None
    }
    await db.payments.insert_one(payment_record)

    return {
        "order_id": order_id,
        "amount": amount_in_paise,
        "currency": currency,
        "key_id": key_id,
        "booking_id": booking_id,
        "is_simulated": is_simulated
    }


# ==========================================
# RAZORPAY VERIFY PAYMENT
# ==========================================

@router.post("/razorpay/verify")
async def verify_razorpay_payment(
    verify_data: RazorpayVerifyPayment,
    payload=Depends(JWTBearer())
):
    """
    Verifies Razorpay payment signature and confirms the booking and slot.
    """
    booking_id = verify_data.booking_id
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID."
        )

    # If this is a real Razorpay order with signature, verify with client
    client = get_razorpay_client()
    key_id, _ = get_razorpay_keys()
    is_demo = verify_data.razorpay_order_id.startswith("order_demo_") or key_id.endswith("_demo")

    if not is_demo and verify_data.razorpay_signature and client:
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": verify_data.razorpay_order_id,
                "razorpay_payment_id": verify_data.razorpay_payment_id,
                "razorpay_signature": verify_data.razorpay_signature
            })
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Razorpay signature verification failed: {str(e)}"
            )

    # Update payment record
    await db.payments.update_one(
        {"razorpay_order_id": verify_data.razorpay_order_id},
        {
            "$set": {
                "booking_id": booking_id,
                "user_email": payload["email"],
                "status": "SUCCESS",
                "payment_method": "Razorpay",
                "razorpay_payment_id": verify_data.razorpay_payment_id,
                "razorpay_signature": verify_data.razorpay_signature,
                "paid_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    # Update booking status to CONFIRMED
    await db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "CONFIRMED"}}
    )

    booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})

    if booking:
        # Mark parking slot as occupied
        await db.parking_slots.update_one(
            {"slot_number": booking["slot_number"]},
            {"$set": {"is_available": False}}
        )

        # Send confirmation email
        try:
            await send_email(
                to_email=payload["email"],
                subject="💳 ParkSmart Razorpay Payment Received",
                body=f"""
Hello,

Your payment via Razorpay has been verified and received successfully.

==================================
Payment ID       : {verify_data.razorpay_payment_id}
Order ID         : {verify_data.razorpay_order_id}
Booking ID       : {booking_id}
Vehicle Number   : {booking.get('vehicle_number')}
Slot Number      : {booking.get('slot_number')}
Amount Paid      : ₹{booking.get('total')}
Payment Method   : Razorpay
Status           : SUCCESS
==================================

Your booking is now confirmed. Please use your QR code at the entrance gate.
Thank you for choosing ParkSmart!
"""
            )
        except Exception as email_err:
            logger.warning(f"Could not send payment email: {email_err}")

    return {
        "status": "SUCCESS",
        "message": "Razorpay payment verified and booking confirmed",
        "booking_status": "CONFIRMED",
        "slot_status": "OCCUPIED",
        "razorpay_payment_id": verify_data.razorpay_payment_id,
        "booking_id": booking_id
    }


# ==========================================
# CREATE PAYMENT (GENERIC / DEMO)
# ==========================================

@router.post("/create")
async def create_payment(
    payment: PaymentCreate,
    payload=Depends(JWTBearer())
):

    if not ObjectId.is_valid(payment.booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID."
        )

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
        "payment_method": "Demonstration / UPI Mock",
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

    if not ObjectId.is_valid(payment_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid payment ID."
        )

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
    if ObjectId.is_valid(payment["booking_id"]):
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
    else:
        booking = None

    if booking:
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

        try:
            await send_email(
                to_email=payment["user_email"],
                subject="💳 ParkSmart Payment Successful",
                body=f"""
Hello,

Your payment has been received successfully.

==================================

Payment ID : {payment_id}
Booking ID : {payment['booking_id']}
Amount Paid : ₹{payment['amount']}
Payment Method : {payment['payment_method']}
Vehicle Number : {booking['vehicle_number']}
Parking Slot : {booking['slot_number']}
Payment Time : {datetime.utcnow()}
Status : SUCCESS

==================================

Your booking has been confirmed.
Thank you for choosing ParkSmart.

Happy Parking!
🚗 ParkSmart Team
"""
            )
        except Exception as email_err:
            print("[Email Notice] Could not send payment email:", email_err)

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
# REFUND BOOKING PAYMENT
# ==========================================

@router.post("/refund/{booking_id}")
async def refund_booking_payment(
    booking_id: str,
    payload=Depends(JWTBearer())
):
    """
    Triggers 20% penalty deduction and 80% refund for a given booking.
    """
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.get("user_email") != payload.get("email") and payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to refund this booking.")

    from app.services.refund_service import process_booking_refund
    result = await process_booking_refund(booking, reason="MANUAL_REFUND")
    return {
        "message": "Refund processed successfully.",
        **result
    }


# ===========================


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
        revenue += payment.get("amount", 0)

    return {
        "total_payments": total_payments,
        "successful_payments": successful,
        "pending_payments": pending,
        "total_revenue": revenue
    }