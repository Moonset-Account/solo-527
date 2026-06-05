from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import route, elder, delivery, subsidy, cold_box, notification
from app.services.photo_storage import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        ensure_bucket()
    except Exception:
        pass
    yield


app = FastAPI(
    title="社区长者助餐配送平台",
    description="社区长者助餐配送管理平台API",
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

app.include_router(route.router)
app.include_router(elder.router)
app.include_router(delivery.router)
app.include_router(subsidy.router)
app.include_router(cold_box.router)
app.include_router(notification.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
