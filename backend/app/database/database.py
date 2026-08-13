from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
<<<<<<< HEAD
DATABASE_NAME = os.getenv("parksmart")

print("Mongo URI loaded:", bool(MONGO_URI))
print("Database name:", DATABASE_NAME)
=======
DATABASE_NAME = os.getenv("DATABASE_NAME")
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f

client = AsyncIOMotorClient(MONGO_URI)

db = client[DATABASE_NAME]