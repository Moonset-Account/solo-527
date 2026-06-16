from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from . import models
from .schemas.common import ResponseModel

from .routers import auth, materials, suppliers, quotes, purchases, agreements, dashboard
from .init_data import init_database

Base.metadata.create_all(bind=engine)
init_database()

app = FastAPI(
    title=settings.APP_NAME,
    description="办公耗材询价比价平台 - 采购管理系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(suppliers.router)
app.include_router(quotes.router)
app.include_router(purchases.router)
app.include_router(agreements.router)
app.include_router(dashboard.router)


@app.get("/api/health", response_model=ResponseModel[dict])
async def health_check():
    return ResponseModel(data={"status": "healthy", "app": settings.APP_NAME})


@app.get("/", response_model=ResponseModel[dict])
async def root():
    return ResponseModel(data={"message": "办公耗材询价比价平台 API", "docs": "/docs"})
