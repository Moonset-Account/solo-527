from __future__ import annotations

import os
from typing import Generator, AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import get_settings

settings = get_settings()

for d in [
    os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", ""))
    if "sqlite" in settings.DATABASE_URL
    else None,
    settings.CHROMA_PERSIST_DIR,
    settings.INDEX_STORAGE_DIR,
    settings.MODEL_REGISTRY_DIR,
    settings.UPLOAD_DIR,
    settings.DATASET_VERSION_DIR,
    settings.AUDIT_LOG_DIR,
]:
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


class Base(DeclarativeBase):
    pass


_sync_db_url = settings.DATABASE_URL
if "sqlite" in _sync_db_url and "+aiosqlite" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("sqlite:///", "sqlite+aiosqlite:///")
elif "postgresql" in _sync_db_url and "+asyncpg" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("postgresql://", "postgresql+asyncpg://")
elif "mysql" in _sync_db_url and "+asyncmy" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("mysql://", "mysql+asyncmy://")
else:
    _async_db_url = _sync_db_url

engine = create_engine(
    _sync_db_url,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if "sqlite" in _sync_db_url else {},
    pool_pre_ping=True,
)

async_engine = create_async_engine(
    _async_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
