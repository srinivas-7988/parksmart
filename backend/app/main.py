import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, vehicle, parking
from app.routers.booking import router as booking_router
from app.routers.dashboard import router as dashboard_router
from app.routers import payment
from app.routers import qr
from app.routers import email
from app.routers import prediction
from app.services.refund_service import check_and_process_no_shows

logger = logging.getLogger("parksmart.worker")


async def no_show_monitor_worker():
    """
    Background worker that runs every 60 seconds to scan for bookings
    exceeding the 30-minute arrival window, deducts 20% penalty, and refunds 80%.
    """
    logger.info("[Background Worker] Automated no-show & refund monitor started.")
    while True:
        try:
            await asyncio.sleep(60)
            processed = await check_and_process_no_shows()
            if processed:
                logger.info(f"[Background Worker] Auto-processed {len(processed)} no-show booking(s)")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"[Background Worker] Error in no-show monitor: {e}")
            await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(no_show_monitor_worker())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="ParkSmart API",
    version="1.0.0",
    description="Backend API for ParkSmart",
    lifespan=lifespan
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# AUTH
# ==========================================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)


# ==========================================
# VEHICLES
# ==========================================

app.include_router(
    vehicle.router,
    prefix="/api/vehicles",
    tags=["Vehicles"]
)


# ==========================================
# PARKING
# ==========================================

app.include_router(
    parking.router,
    prefix="/api/parking",
    tags=["Parking"]
)


# ==========================================
# BOOKINGS
# ==========================================

app.include_router(
    booking_router,
    prefix="/api/bookings",
    tags=["Bookings"]
)


# ==========================================
# DASHBOARD
# ==========================================

app.include_router(
    dashboard_router,
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


# ==========================================
# PAYMENT
# ==========================================

app.include_router(
    payment.router,
    prefix="/api/payment",
    tags=["Payment"]
)


# ==========================================
# QR CODE
# ==========================================

app.include_router(
    qr.router,
    prefix="/api/qr",
    tags=["QR Code"]
)


# ==========================================
# EMAIL
# ==========================================

app.include_router(
    email.router,
    prefix="/api/email",
    tags=["Email"]
)


# ==========================================
# ML PREDICTION
# ==========================================

app.include_router(
    prediction.router,
    prefix="/api/prediction",
    tags=["ML Prediction"]
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
async def root():

    return {
        "message": "ParkSmart Backend Running 🚗"
    }