from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database.database import db
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.auth.auth_bearer import JWTBearer
from app.schemas.parking import ParkingSlotCreate, ParkingSlotUpdate

router = APIRouter()


@router.post("/")
async def add_vehicle(
    vehicle: VehicleCreate,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    existing_vehicle = await db.vehicles.find_one(
        {"vehicle_number": vehicle.vehicle_number.upper()}
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists."
        )

    new_vehicle = {
        "user_email": user_email,
        "vehicle_number": vehicle.vehicle_number.upper(),
        "vehicle_type": vehicle.vehicle_type,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "color": vehicle.color,
        "created_at": datetime.utcnow()
    }

    result = await db.vehicles.insert_one(new_vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle_id": str(result.inserted_id)
    }
    # ===========================
# GET MY VEHICLES
# ===========================

@router.get("/")
async def get_my_vehicles(
    payload=Depends(JWTBearer())
):
    try:

        user_email = payload["email"]

        vehicles = await db.vehicles.find(
            {"user_email": user_email},
            {"_id": 0}
        ).to_list(length=None)

        return {
            "total": len(vehicles),
            "vehicles": vehicles
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        # ===========================
# UPDATE VEHICLE
# ===========================

@router.put("/{vehicle_number}")
async def update_vehicle(
    vehicle_number: str,
    vehicle: VehicleUpdate,
    payload=Depends(JWTBearer())
):
    user_email = payload["email"]

    existing_vehicle = await db.vehicles.find_one({
        "vehicle_number": vehicle_number.upper(),
        "user_email": user_email
    })

    if not existing_vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    update_data = {
        key: value
        for key, value in vehicle.dict(exclude_unset=True).items()
    }

    if "vehicle_number" in update_data:
        update_data["vehicle_number"] = update_data["vehicle_number"].upper()

    await db.vehicles.update_one(
        {
            "vehicle_number": vehicle_number.upper(),
            "user_email": user_email
        },
        {
            "$set": update_data
        }
    )

    return {
        "message": "Vehicle updated successfully"
    }
    # ===========================
# DELETE VEHICLE
# ===========================

@router.delete("/{vehicle_number}")
async def delete_vehicle(
    vehicle_number: str,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    vehicle = await db.vehicles.find_one({
        "vehicle_number": vehicle_number.upper(),
        "user_email": user_email
    })

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    await db.vehicles.delete_one({
        "vehicle_number": vehicle_number.upper(),
        "user_email": user_email
    })

    return {
        "message": "Vehicle deleted successfully"
    }
    # ===========================
# UPDATE PARKING SLOT
# ===========================

@router.put("/{slot_number}")
async def update_parking_slot(
    slot_number: str,
    slot: ParkingSlotUpdate
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