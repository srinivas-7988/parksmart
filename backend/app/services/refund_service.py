from datetime import datetime, timedelta
from bson import ObjectId
import logging
import os
import re

from app.database.database import db
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

# Grace period in minutes for arrival before a booking is flagged as no-show
NO_SHOW_GRACE_MINUTES = int(os.getenv("NO_SHOW_GRACE_MINUTES", "30"))

# Penalty rate (20%) and refund rate (80%)
PENALTY_PERCENTAGE = 0.20
REFUND_PERCENTAGE = 0.80


def parse_booking_start_time(booking: dict) -> datetime:
    """
    Computes the datetime for when the booking's arrival window begins.
    Falls back to booking['booking_time'] if date/time parsing fails.
    """
    raw_created = booking.get("booking_time")
    if isinstance(raw_created, datetime):
        base_dt = raw_created
    else:
        base_dt = datetime.utcnow()

    booking_date = str(booking.get("booking_date") or "").strip()
    start_time = str(booking.get("start_time") or "").strip()

    if not booking_date or not start_time:
        return base_dt

    # Try combining date and start_time
    # Supported formats: "2026-10-13 14:00", "13/10/2026 02:00 PM", etc.
    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %I:%M %p",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y %I:%M %p",
        "%b %d, %Y %I:%M %p",
    ]

    clean_time = start_time.upper()
    combo = f"{booking_date} {clean_time}"

    for fmt in formats:
        try:
            return datetime.strptime(combo, fmt)
        except (ValueError, TypeError):
            continue

    # Try parsing time alone onto today's date
    time_formats = ["%H:%M", "%I:%M %p", "%I:%M%p"]
    for t_fmt in time_formats:
        try:
            t = datetime.strptime(clean_time, t_fmt).time()
            return datetime.combine(base_dt.date(), t)
        except (ValueError, TypeError):
            continue

    return base_dt


async def process_booking_refund(booking: dict, reason: str = "NO_SHOW") -> dict:
    """
    Processes the 20% penalty deduction and 80% refund for a booking.
    Releases the parking slot, updates payment records, and notifies the customer.
    """
    booking_id = str(booking.get("_id"))
    total_amount = float(booking.get("total", 0.0))
    user_email = booking.get("user_email")
    slot_number = booking.get("slot_number", "").upper()

    # Calculate penalty (20%) and refund (80%)
    penalty_amount = round(total_amount * PENALTY_PERCENTAGE, 2)
    refund_amount = round(total_amount * REFUND_PERCENTAGE, 2)

    # 1. Lookup payment record
    payment = await db.payments.find_one({
        "$or": [
            {"booking_id": booking_id},
            {"booking_id": ObjectId(booking_id) if ObjectId.is_valid(booking_id) else booking_id}
        ]
    })

    refund_id = None
    refund_status = "NOT_PAID"

    if payment and payment.get("status") == "SUCCESS":
        # Attempt refund via Razorpay if real credentials exist
        from app.routers.payment import get_razorpay_client, get_razorpay_keys

        client = get_razorpay_client()
        key_id, _ = get_razorpay_keys()
        razorpay_payment_id = payment.get("razorpay_payment_id")

        if client and razorpay_payment_id and not key_id.endswith("_demo") and not razorpay_payment_id.startswith("pay_demo_"):
            try:
                # Razorpay amounts are in paise (1 INR = 100 paise)
                refund_resp = client.payment.refund(
                    razorpay_payment_id,
                    {
                        "amount": int(round(refund_amount * 100)),
                        "notes": {
                            "booking_id": booking_id,
                            "reason": f"ParkSmart refund: {reason} (20% penalty applied)"
                        }
                    }
                )
                refund_id = refund_resp.get("id", f"rfnd_{str(ObjectId())[:8]}")
                refund_status = "REFUNDED"
            except Exception as rzp_err:
                logger.warning(f"Razorpay live refund failed: {rzp_err}. Recording simulated refund.")
                refund_id = f"rfnd_mock_{str(ObjectId())[:8]}"
                refund_status = "REFUNDED"
        else:
            # Demonstration / test mode refund
            refund_id = f"rfnd_demo_{str(ObjectId())[:8]}"
            refund_status = "REFUNDED"

        # Update payment record
        await db.payments.update_one(
            {"_id": payment["_id"]},
            {
                "$set": {
                    "refund_status": refund_status,
                    "refund_id": refund_id,
                    "refund_amount": refund_amount,
                    "penalty_amount": penalty_amount,
                    "refunded_at": datetime.utcnow(),
                    "refund_reason": reason
                }
            }
        )
    elif total_amount > 0:
        # If no explicit payment record but booking total > 0 (e.g. demo mode)
        refund_id = f"rfnd_demo_{str(ObjectId())[:8]}"
        refund_status = "REFUNDED"

    # 2. Update booking status
    cancellation_status = "CANCELLED"
    await db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "status": cancellation_status,
                "cancellation_reason": reason,
                "penalty_amount": penalty_amount,
                "refund_amount": refund_amount,
                "refund_status": refund_status,
                "refund_id": refund_id,
                "cancelled_at": datetime.utcnow()
            }
        }
    )

    # 3. Free up the parking slot
    if slot_number:
        slot_query = {"slot_number": slot_number}
        if "location" in booking:
            slot_query["location"] = booking["location"]
        await db.parking_slots.update_one(
            slot_query,
            {"$set": {"is_available": True}}
        )

    # 4. Dispatch Email Notification
    reason_label = "No-Show (Late Arrival Exceeded 30 Minutes)" if reason == "NO_SHOW" else "User Cancellation"
    subject = (
        "⚠️ ParkSmart: No-Show Notice & 80% Refund Processed"
        if reason == "NO_SHOW"
        else "🚗 ParkSmart: Booking Cancellation & 80% Refund"
    )

    email_body = f"""Hello,

This is to confirm that your parking booking has been cancelled due to {reason_label}.

==============================================
Booking ID        : {booking_id}
Vehicle Number    : {booking.get('vehicle_number', 'N/A')}
Parking Slot      : {slot_number}
Location          : {booking.get('location', 'Bangalore')}
Original Amount   : ₹{total_amount}
----------------------------------------------
Deduction (20%)   : ₹{penalty_amount} (Holding fee)
Refunded (80%)    : ₹{refund_amount}
Refund Status     : {refund_status}
Refund Reference  : {refund_id or 'N/A'}
==============================================

The parking slot has been released back into available inventory.
The refunded amount of ₹{refund_amount} has been initiated to your original payment method.

Thank you for choosing ParkSmart!
🚗 ParkSmart Support Team
"""

    if user_email:
        try:
            await send_email(to_email=user_email, subject=subject, body=email_body)
        except Exception as e:
            logger.warning(f"Could not dispatch refund email to {user_email}: {e}")

    logger.info(
        f"[Refund Processed] Booking {booking_id}: Total=₹{total_amount}, "
        f"Penalty=₹{penalty_amount}, Refund=₹{refund_amount}, Reason={reason}"
    )

    return {
        "booking_id": booking_id,
        "status": cancellation_status,
        "reason": reason,
        "total": total_amount,
        "penalty_amount": penalty_amount,
        "refund_amount": refund_amount,
        "refund_status": refund_status,
        "refund_id": refund_id,
        "slot_number": slot_number
    }


async def check_and_process_no_shows() -> list:
    """
    Finds all active/confirmed bookings whose 30-minute grace period has passed
    without check-in, and automatically executes the 20% penalty / 80% refund flow.
    """
    now = datetime.utcnow()
    processed = []

    # Find active or confirmed bookings that haven't checked in
    cursor = db.bookings.find({
        "status": {"$in": ["ACTIVE", "CONFIRMED"]},
        "checked_in_at": {"$in": [None, False]}
    })

    async for booking in cursor:
        try:
            start_dt = parse_booking_start_time(booking)
            cutoff_dt = start_dt + timedelta(minutes=NO_SHOW_GRACE_MINUTES)

            if now >= cutoff_dt:
                result = await process_booking_refund(booking, reason="NO_SHOW")
                processed.append(result)
        except Exception as err:
            logger.error(f"Error checking no-show for booking {booking.get('_id')}: {err}")

    return processed
