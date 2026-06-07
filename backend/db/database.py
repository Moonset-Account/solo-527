from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config import TIMESCALEDB_URI
from backend.models.schema import Base

engine = create_engine(TIMESCALEDB_URI, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(engine)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
