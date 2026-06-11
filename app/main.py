from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import Base, engine
from app.routers import api_router
from app.middleware import AuthMiddleware, LoggingMiddleware
from app.utils.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    logger.info("Starting scheduler...")
    start_scheduler()
    logger.info("Scheduler started successfully")

    yield

    logger.info("Shutting down scheduler...")
    shutdown_scheduler()
    logger.info("Scheduler shut down successfully")


app = FastAPI(
    title="工程材料供应商准入管理系统",
    description="基于 FastAPI + HTMX + PostgreSQL + Redis 的工程材料供应商准入管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(api_router, prefix="/api")
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
