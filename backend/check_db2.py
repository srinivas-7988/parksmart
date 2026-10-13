import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient('mongodb+srv://admin123:Parksmart123@cluster0.qzcntwh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['parksmart']
async def main():
    async for user in db.users.find({}):
        print(user)
asyncio.run(main())
