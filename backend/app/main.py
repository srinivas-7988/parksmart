from fastapi import FastAPI
from app.routers import auth, vehicle,parking
from app.routers.booking import router as booking_router
from app.routers.dashboard import router as dashboard_router
from app.routers import payment
from app.routers import qr

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
app.include_router(
    parking.router,
    prefix="/api/parking",
    tags=["Parking"]
)
app.include_router(
    booking_router,
    prefix="/api/bookings",
    tags=["Bookings"]
)
app.include_router(
    dashboard_router,
    prefix="/api/dashboard",
    tags=["Dashboard"]
)
app.include_router(
    payment.router,
    prefix="/api/payment",
    tags=["Payment"]
)
app.include_router(
    qr.router,
    prefix="/api/qr",
    tags=["QR Code"]
)
@app.get("/")
async def root():
    return {
        "message": "ParkSmart Backend Running 🚗"
    }