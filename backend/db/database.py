from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config import DB_URI, DB_ENGINE, TIMESCALEDB_URI
from backend.models.schema import Base

_active_uri = TIMESCALEDB_URI if DB_ENGINE == "timescaledb" else DB_URI

engine = create_engine(_active_uri, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(engine)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
