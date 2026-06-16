import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

from app.config import settings

_db_url = settings.DATABASE_URL

if _db_url.startswith("postgresql"):
    try:
        import asyncpg  # noqa: F401
    except ImportError:
        _db_url = "sqlite+aiosqlite:///./ar_reconciliation.db"

if _db_url.startswith("sqlite"):
    try:
        import aiosqlite  # noqa: F401
    except ImportError:
        os.system("pip install aiosqlite -q")

engine = create_async_engine(
    _db_url,
    echo=False,
    connect_args={"check_same_thread": False} if _db_url.startswith("sqlite") else {},
)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
