import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = AsyncIOMotorClient('mongodb+srv://admin123:Parksmart123@cluster0.qzcntwh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['parksmart']

async def main():
    email = "test@example.com"
    password = "password123"
    hashed_password = pwd_context.hash(password)
    
    # Check if exists
    user = await db.users.find_one({"email": email})
    if user:
        await db.users.update_one({"email": email}, {"$set": {"password": hashed_password}})
        print("Updated user password")
    else:
        await db.users.insert_one({
            "full_name": "Test User",
            "email": email,
            "phone": "1234567890",
            "password": hashed_password,
            "role": "user"
        })
        print("Created test user")

asyncio.run(main())
