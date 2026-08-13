import asyncio
from app.database.database import client, db


async def main():
    await client.admin.command('ping')
    print('Connected to MongoDB!')
    print('Database:', db.name)
    client.close()


if __name__ == '__main__':
    asyncio.run(main())
