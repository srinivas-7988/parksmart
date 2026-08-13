from fastapi import FastAPI
<<<<<<< HEAD
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import db
from app.routers import auth, vehicle, parking, payment, qr, email
from app.routers.booking import router as booking_router
from app.routers.dashboard import router as dashboard_router
=======
from app.routers import auth, vehicle,parking
from app.routers.booking import router as booking_router
from app.routers.dashboard import router as dashboard_router
from app.routers import payment
from app.routers import qr
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f

app = FastAPI(
    title="ParkSmart API",
    version="1.0.0",
<<<<<<< HEAD
    description="Backend API for ParkSmart",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vehicle.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(parking.router, prefix="/api/parking", tags=["Parking"])
app.include_router(booking_router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(payment.router, prefix="/api/payment", tags=["Payment"])
app.include_router(qr.router, prefix="/api/qr", tags=["QR Code"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])


@app.on_event("startup")
async def seed_parking_slots():
    """Create the demo A1-C8 parking slots once if the collection is empty."""
    if await db.parking_slots.count_documents({}) == 0:
        slots = []
        for section in ("A", "B", "C"):
            for number in range(1, 9):
                slots.append({
                    "slot_number": f"{section}{number}",
                    "floor": 1,
                    "section": section,
                    "vehicle_type": "car",
                    "is_available": True,
                })
        await db.parking_slots.insert_many(slots)


@app.get("/")
async def root():
    return {"message": "ParkSmart Backend Running 🚗"}
=======
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
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
