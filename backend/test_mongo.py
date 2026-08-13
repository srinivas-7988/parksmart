<<<<<<< HEAD
import asyncio
from app.database.database import client, db


async def main():
    await client.admin.command('ping')
    print('Connected to MongoDB!')
    print('Database:', db.name)
    client.close()


if __name__ == '__main__':
    asyncio.run(main())
=======
from app.database.database import db

print("Connected to MongoDB!")
print("Database:", db.name)
>>>>>>> af762a01ed01c9f51f1c366ed206d70b2181534f
