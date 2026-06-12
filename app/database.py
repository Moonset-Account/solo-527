from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy import event

from app.config import settings


def get_db_url():
    if settings.run_mode in ("test", "demo"):
        return settings.database_url_test
    return settings.database_url


engine = create_engine(
    get_db_url(),
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    try:
        from app.seed_data import seed_all
        seed_all()
    except Exception as e:
        print(f"[init_db] seed skipped: {e}")
