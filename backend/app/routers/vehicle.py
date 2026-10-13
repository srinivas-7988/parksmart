from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database.database import db
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.auth.auth_bearer import JWTBearer

router = APIRouter()


# =========================
# ADD VEHICLE
# =========================

@router.post("/")
async def add_vehicle(
    vehicle: VehicleCreate,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    existing = await db.vehicles.find_one({
        "vehicle_number": vehicle.vehicle_number.upper()
    })

    if existing:
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


# =========================
# GET MY VEHICLES
# =========================

@router.get("/")
async def get_my_vehicles(
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    vehicles = await db.vehicles.find(
        {"user_email": user_email},
        {"_id": 0}
    ).to_list(length=None)

    # Auto-sync fallback: If user registered with vehicle during signup, ensure it's in vehicles collection
    if not vehicles:
        user = await db.users.find_one({"email": user_email})
        if user and user.get("vehicle_number"):
            v_num = user["vehicle_number"].strip().upper()
            auto_v = {
                "user_email": user_email,
                "vehicle_number": v_num,
                "vehicle_type": "CAR",
                "brand": "Standard",
                "model": "Car",
                "color": "Default",
                "created_at": datetime.utcnow()
            }
            await db.vehicles.update_one(
                {"vehicle_number": v_num},
                {"$set": auto_v},
                upsert=True
            )
            vehicles = [{
                "user_email": user_email,
                "vehicle_number": v_num,
                "vehicle_type": "CAR",
                "brand": "Standard",
                "model": "Car",
                "color": "Default"
            }]

    return {
        "total": len(vehicles),
        "vehicles": vehicles
    }


# =========================
# UPDATE VEHICLE
# =========================

@router.put("/{vehicle_number}")
async def update_vehicle(
    vehicle_number: str,
    vehicle: VehicleUpdate,
    payload=Depends(JWTBearer())
):

    user_email = payload["email"]

    existing = await db.vehicles.find_one({
        "vehicle_number": vehicle_number.upper(),
        "user_email": user_email
    })

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    update_data = vehicle.model_dump(
        exclude_unset=True
    )

    if "vehicle_number" in update_data:
        update_data["vehicle_number"] = (
            update_data["vehicle_number"].upper()
        )

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


# =========================
# DELETE VEHICLE
# =========================

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