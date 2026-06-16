from contextlib import asynccontextmanager
from datetime import datetime
from logging import getLogger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, _db_url
from app.routers import ar_record, payment, refund, writeoff, cash_gap, reminder, export

logger = getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database initialized: {_db_url}")
    except Exception as e:
        logger.warning(f"Database init failed: {e}. Tables will be created on first request.")
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ar_record.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(refund.router, prefix="/api")
app.include_router(writeoff.router, prefix="/api")
app.include_router(cash_gap.router, prefix="/api")
app.include_router(reminder.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "timestamp": datetime.utcnow().isoformat(),
    }
