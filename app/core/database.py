from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from typing import AsyncGenerator


def get_database_url():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql") and "sqlite" not in db_url:
        try:
            from app.core.database_sqlite import check_sqlite_fallback
            if check_sqlite_fallback():
                return "sqlite+aiosqlite:///./pet_grooming.db"
        except ImportError:
            pass
    return db_url


engine = create_async_engine(
    get_database_url(),
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True if "sqlite" not in get_database_url() else False,
    **({"pool_size": 10, "max_overflow": 20} if "sqlite" not in get_database_url() else {}),
    connect_args={"check_same_thread": False} if "sqlite" in get_database_url() else {},
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


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
