from fastapi import APIRouter, HTTPException, Depends
from app.database.database import db
from app.schemas.user import UserCreate, UserLogin
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.auth_bearer import JWTBearer
import traceback

router = APIRouter()


# ===========================
# REGISTER
# ===========================

@router.post("/register")
async def register(user: UserCreate):
    try:
        existing_user = await db.users.find_one({"email": user.email})

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        new_user = {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "password": hash_password(user.password),
            "role": "user"
        }

        await db.users.insert_one(new_user)

        return {
            "message": "User Registered Successfully"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# LOGIN
# ===========================

@router.post("/login")
async def login(user: UserLogin):
    try:
        existing_user = await db.users.find_one(
            {"email": user.email}
        )

        if not existing_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid Email or Password"
            )

        if not verify_password(
            user.password,
            existing_user["password"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid Email or Password"
            )

        access_token = create_access_token(
            {
                "email": existing_user["email"],
                "role": existing_user["role"]
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "full_name": existing_user["full_name"],
                "email": existing_user["email"],
                "phone": existing_user["phone"],
                "role": existing_user["role"]
            }
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# GET CURRENT USER
# ===========================

@router.get("/me")
async def get_current_user(payload=Depends(JWTBearer())):
    try:
        email = payload["email"]

        user = await db.users.find_one(
            {"email": email},
            {"password": 0}
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        user["_id"] = str(user["_id"])

        return user

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))