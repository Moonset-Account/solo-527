import asyncio
from sqlalchemy import text
from app.database import engine, Base
from app.models.models import (
    User, Customer, Plan, BudgetVersion, Contract,
    AcceptanceTemplate, InspectionTemplate, InspectionTask,
    InspectionRecord, SatisfactionRecord, Notification, ConfigChangeLog,
)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully")


asyncio.run(create_tables())
