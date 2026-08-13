from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("parksmart")

print("Mongo URI loaded:", bool(MONGO_URI))
print("Database name:", DATABASE_NAME)

client = AsyncIOMotorClient(MONGO_URI)

db = client[DATABASE_NAME]