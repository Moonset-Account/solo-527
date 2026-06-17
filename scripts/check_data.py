import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_maker
from sqlalchemy import select, text
from app.models.models import User

async def check_data():
    async with async_session_maker() as db:
        try:
            result = await db.execute(select(User).limit(5))
            users = result.scalars().all()
            print(f"Users found: {len(users)}")
            for u in users:
                print(f"  - {u.username} ({u.role})")
        except Exception as e:
            print(f"Query users error: {e}")
        
        try:
            result = await db.execute(text("SELECT COUNT(*) FROM appointments"))
            print(f"Appointments: {result.scalar_one()}")
            
            result = await db.execute(text("SELECT COUNT(*) FROM health_records"))
            print(f"Health records: {result.scalar_one()}")
            
            result = await db.execute(text("SELECT COUNT(*) FROM repurchase_anomalies"))
            print(f"Repurchase anomalies: {result.scalar_one()}")
            
            result = await db.execute(text("SELECT COUNT(*) FROM stores"))
            print(f"Stores: {result.scalar_one()}")
        except Exception as e:
            print(f"Count error: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
