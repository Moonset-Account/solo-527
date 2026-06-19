from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import auth, events, registrations, devices, checkins
from app.api import todos, refund_exceptions, operation_logs, exports, statistics

settings = get_settings()

app = FastAPI(
    title="票务运营签到核销系统 API",
    description="行业峰会签到核销系统后端API",
    version="1.0.0",
    debug=settings.DEBUG,
)

if not settings.is_production:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8080",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {
        "message": "票务运营签到核销系统 API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(registrations.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(checkins.router, prefix="/api/v1")
app.include_router(todos.router, prefix="/api/v1")
app.include_router(refund_exceptions.router, prefix="/api/v1")
app.include_router(operation_logs.router, prefix="/api/v1")
app.include_router(exports.router, prefix="/api/v1")
app.include_router(statistics.router, prefix="/api/v1")
