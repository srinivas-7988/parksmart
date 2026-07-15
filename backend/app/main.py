from fastapi import FastAPI
from app.routers import auth, vehicle

app = FastAPI(
    title="ParkSmart API",
    version="1.0.0",
    description="Backend API for ParkSmart"
)

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

app.include_router(
    vehicle.router,
    prefix="/api/vehicles",
    tags=["Vehicles"]
)


@app.get("/")
async def root():
    return {
        "message": "ParkSmart Backend Running 🚗"
    }