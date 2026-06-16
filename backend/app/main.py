from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from . import models

from .routers import auth, materials, suppliers, quotes, purchases, agreements, dashboard

Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/")
async def root():
    return {"message": "办公耗材询价比价平台 API", "docs": "/docs"}
