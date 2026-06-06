from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.middleware import ErrorLoggingMiddleware
from app.routers import (
    auth,
    users,
    doctors,
    locations,
    volunteers,
    medicines,
    schedules,
    medicine_boxes,
    registrations,
    service,
    returns,
    stats,
    notifications
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="公益医疗协调员移动义诊物资和排班系统 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ErrorLoggingMiddleware)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(doctors.router)
app.include_router(locations.router)
app.include_router(volunteers.router)
app.include_router(medicines.router)
app.include_router(schedules.router)
app.include_router(medicine_boxes.router)
app.include_router(registrations.router)
app.include_router(service.router)
app.include_router(returns.router)
app.include_router(stats.router)
app.include_router(notifications.router)
