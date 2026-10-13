from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import asyncio

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "parksmart")

class DatabaseProxy:
    """
    Transparent proxy for Motor database that connects to MongoDB Atlas
    and gracefully falls back to an in-memory Motor store when the remote
    Atlas cluster is sleeping, paused, or unreachable.
    """
    def __init__(self):
        self._db = None
        self._client = None
        self._is_mock = False
        self._initialized = False
        self._init_lock = None

    async def _ensure_db(self):
        if self._init_lock is None:
            self._init_lock = asyncio.Lock()

        async with self._init_lock:
            if self._initialized:
                return self._db

            try:
                real_client = AsyncIOMotorClient(
                    MONGO_URI,
                    serverSelectionTimeoutMS=2000,
                    connectTimeoutMS=2000
                )
                await real_client.admin.command("ping")
                self._client = real_client
                self._db = real_client[DATABASE_NAME]
                self._is_mock = False
                print(f"[Database] Connected to MongoDB Atlas '{DATABASE_NAME}'.")
            except Exception as e:
                print(f"[Database] Atlas unavailable ({type(e).__name__}): {e}")
                print("[Database] Using local in-memory database store.")
                from mongomock_motor import AsyncMongoMockClient
                mock_client = AsyncMongoMockClient()
                self._client = mock_client
                self._db = mock_client[DATABASE_NAME]
                self._is_mock = True
                await self._seed_defaults()

            self._initialized = True
            return self._db

    async def _seed_defaults(self):
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Seed test user
        user = await self._db.users.find_one({"email": "test@example.com"})
        if not user:
            await self._db.users.insert_one({
                "full_name": "Arjun Kumar",
                "email": "test@example.com",
                "phone": "+91 98765 43210",
                "password": pwd_context.hash("password123"),
                "role": "user"
            })
            await self._db.vehicles.insert_one({
                "user_email": "test@example.com",
                "vehicle_number": "KA 01 AB 1234",
                "vehicle_type": "CAR",
                "brand": "Hyundai",
                "model": "i20",
                "color": "White"
            })

        # Seed parking slots across all 8 zones
        locations = [
            "Brigade Road", "MG Road", "Koramangala", "Commercial Street",
            "Indiranagar", "Jayanagar", "Orion Mall", "Garuda Mall"
        ]
        count = await self._db.parking_slots.count_documents({})
        if count == 0:
            slots = []
            for loc in locations:
                for sec in ["A", "B", "C"]:
                    for num in range(1, 9):
                        slots.append({
                            "slot_number": f"{sec}{num}",
                            "floor": 1,
                            "section": sec,
                            "vehicle_type": "CAR",
                            "location": loc,
                            "is_available": True
                        })
            if slots:
                await self._db.parking_slots.insert_many(slots)

    def __getattr__(self, name):
        class CollectionWrapper:
            def __init__(self, proxy, col_name):
                self._proxy = proxy
                self._col_name = col_name

            def __getattr__(self, op_name):
                if op_name == "find":
                    def find_op(*args, **kwargs):
                        class CursorWrapper:
                            def __init__(self, proxy, col_name, f_args, f_kwargs):
                                self._proxy = proxy
                                self._col_name = col_name
                                self._f_args = f_args
                                self._f_kwargs = f_kwargs
                                self._sort = None

                            def sort(self, *s_args, **s_kwargs):
                                self._sort = (s_args, s_kwargs)
                                return self

                            async def to_list(self, length=None):
                                await self._proxy._ensure_db()
                                col = getattr(self._proxy._db, self._col_name)
                                cur = col.find(*self._f_args, **self._f_kwargs)
                                if self._sort:
                                    cur = cur.sort(*self._sort[0], **self._sort[1])
                                return await cur.to_list(length=length)

                            def __aiter__(self):
                                async def gen():
                                    await self._proxy._ensure_db()
                                    col = getattr(self._proxy._db, self._col_name)
                                    cur = col.find(*self._f_args, **self._f_kwargs)
                                    if self._sort:
                                        cur = cur.sort(*self._sort[0], **self._sort[1])
                                    async for item in cur:
                                        yield item
                                return gen()

                        return CursorWrapper(self._proxy, self._col_name, args, kwargs)
                    return find_op

                async def async_op(*args, **kwargs):
                    await self._proxy._ensure_db()
                    col = getattr(self._proxy._db, self._col_name)
                    op = getattr(col, op_name)
                    return await op(*args, **kwargs)

                return async_op

        return CollectionWrapper(self, name)


db = DatabaseProxy()
client = db