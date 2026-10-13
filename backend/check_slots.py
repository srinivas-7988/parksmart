import asyncio
from app.database.database import db

async def check():
    slots = await db.parking_slots.find(
        {"location": "Brigade Road"},
        {"_id": 0}
    ).to_list(length=None)

    print("Total:", len(slots))

    for slot in slots:
        print(slot)

asyncio.run(check())