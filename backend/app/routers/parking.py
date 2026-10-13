from fastapi import APIRouter, HTTPException,Depends
from datetime import datetime
from app.auth.admin_bearer import AdminBearer
from app.database.database import db
from app.schemas.parking import ParkingSlotCreate, ParkingSlotUpdate

router = APIRouter()


@router.post("/")
async def add_parking_slot(
    slot: ParkingSlotCreate,
    payload=Depends(AdminBearer())
):

    existing_slot = await db.parking_slots.find_one(
        {
            "slot_number": slot.slot_number.upper(),
            "location": slot.location
        }
    )

    if existing_slot:
        raise HTTPException(
            status_code=400,
            detail="Parking slot already exists."
        )

    new_slot = {
        "slot_number": slot.slot_number.upper(),
        "floor": slot.floor,
        "section": slot.section.upper(),
        "vehicle_type": slot.vehicle_type,
        "location": slot.location,
        "is_available": True,
        "created_at": datetime.utcnow()
    }

    result = await db.parking_slots.insert_one(new_slot)

    return {
        "message": "Parking slot added successfully",
        "slot_id": str(result.inserted_id)
    }


# ===========================
# GET ALL PARKING SLOTS
# ===========================

@router.get("/")
async def get_all_slots():

    slots = await db.parking_slots.find(
        {},
        {"_id": 0}
    ).to_list(length=None)

    return {
        "total": len(slots),
        "slots": slots
    }
# ===========================
# GET PARKING SLOTS BY LOCATION
# ===========================

@router.get("/location/{location}")
async def get_slots_by_location(location: str):

    # Try exact match first
    slots = await db.parking_slots.find(
        {"location": location},
        {"_id": 0}
    ).to_list(length=None)

    # Fallback to case-insensitive match
    if not slots:
        import re
        slots = await db.parking_slots.find(
            {"location": {"$regex": f"^{re.escape(location)}$", "$options": "i"}},
            {"_id": 0}
        ).to_list(length=None)

    return {
        "location": location,
        "total": len(slots),
        "slots": slots
    }


# ===========================
# AVAILABLE PARKING SLOTS
# ===========================

@router.get("/available")
async def get_available_slots():

    slots = await db.parking_slots.find(
        {"is_available": True},
        {"_id": 0}
    ).to_list(length=None)

    return {
        "total": len(slots),
        "available_slots": slots
    }


# ===========================
# ADMIN PARKING SLOTS
# ===========================

@router.get("/admin")
async def get_admin_parking():

    slots = await db.parking_slots.find(
        {},
        {"_id": 0}
    ).to_list(length=None)

    available = sum(1 for s in slots if s.get("is_available"))
    occupied = len(slots) - available

    return {
        "total": len(slots),
        "available": available,
        "occupied": occupied,
        "slots": slots
    }


# ===========================
# UPDATE PARKING SLOT
# ===========================

@router.put("/{slot_number}")
async def update_parking_slot(
    slot_number: str,
    slot: ParkingSlotUpdate,
    payload=Depends(AdminBearer())
):

    existing_slot = await db.parking_slots.find_one(
        {
            "slot_number": slot_number.upper()
        }
    )

    if not existing_slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found."
        )

    update_data = {
        key: value
        for key, value in slot.model_dump(exclude_unset=True).items()
    }

    if "section" in update_data:
        update_data["section"] = update_data["section"].upper()

    await db.parking_slots.update_one(
        {"slot_number": slot_number.upper()},
        {"$set": update_data}
    )

    return {
        "message": "Parking slot updated successfully"
    }


# ===========================
# DELETE PARKING SLOT
# ===========================

@router.delete("/{slot_number}")
async def delete_parking_slot(
    slot_number: str,
    payload=Depends(AdminBearer())
):

    result = await db.parking_slots.delete_one(
        {
            "slot_number": slot_number.upper()
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found."
        )

    return {
        "message": "Parking slot deleted successfully"
    }
