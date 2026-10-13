import asyncio

from app.database.database import db

LOCATIONS = [
    "Brigade Road",
    "MG Road",
    "Koramangala",
    "Commercial Street",
    "Indiranagar",
    "Jayanagar",
    "Orion Mall",
    "Garuda Mall",
]

async def seed_parking_slots():

    # Remove existing parking slots
    await db.parking_slots.delete_many({})

    slots = []

    for location in LOCATIONS:

        for section in ["A", "B", "C"]:

            for number in range(1, 9):

                slot = {
                    "slot_number": f"{section}{number}",
                    "floor": 1,
                    "section": section,
                    "vehicle_type": "CAR",
                    "location": location,
                    "is_available": True,
                }

                slots.append(slot)

    if slots:

        result = await db.parking_slots.insert_many(slots)

        print(
            f"Successfully inserted {len(result.inserted_ids)} parking slots."
        )

    else:

        print("No parking slots were generated.")


if __name__ == "__main__":

    asyncio.run(seed_parking_slots())