from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import (
    dashboard_router,
    tenant_router,
    plan_router,
    usage_router,
    anomaly_router,
    billing_router,
    arrears_router,
    dictionary_router,
    reminder_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="API用量自助配置门户", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(dashboard_router)
app.include_router(tenant_router)
app.include_router(plan_router)
app.include_router(usage_router)
app.include_router(anomaly_router)
app.include_router(billing_router)
app.include_router(arrears_router)
app.include_router(dictionary_router)
app.include_router(reminder_router)
