from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

connect_args = {}
engine_args = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 3600

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, **engine_args)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
