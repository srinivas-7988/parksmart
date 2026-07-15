from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.database.database import db
from app.schemas.vehicle import VehicleCreate
from app.auth.auth_bearer import JWTBearer

router = APIRouter()


# ===========================
# ADD VEHICLE
# ===========================

@router.post("/")
async def add_vehicle(
    vehicle: VehicleCreate,
    payload=Depends(JWTBearer())
):
    try:

        # Get logged-in user's email
        user_email = payload["email"]

        # Check if the vehicle already exists
        existing_vehicle = await db.vehicles.find_one(
            {"vehicle_number": vehicle.vehicle_number}
        )

        if existing_vehicle:
            raise HTTPException(
                status_code=400,
                detail="Vehicle already exists."
            )

        # Create vehicle document
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

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )