from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    os.makedirs(settings.MODEL_STORE_DIR, exist_ok=True)
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="客服工单自动归因系统 - FastAPI + PyTorch",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["系统"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "debug": settings.DEBUG,
    }


@app.get("/", tags=["系统"])
def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "redoc": "/redoc",
        "api_prefix": settings.API_V1_PREFIX,
    }
