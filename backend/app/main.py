from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api import api_router
from app.middleware.error_logging import ErrorLoggingMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="IT账号变更审批流系统 - 基于FastAPI + PostgreSQL + Celery",
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

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }


def init_default_data():
    from sqlalchemy.orm import Session
    from app.core.security import hash_password
    from app.models import User, UserRole, DeviceInspection, Alert, Vulnerability

    db = Session(bind=engine)
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@example.com",
                full_name="系统管理员",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                department="IT部"
            )
            db.add(admin)

        security = db.query(User).filter(User.username == "security").first()
        if not security:
            security = User(
                username="security",
                email="security@example.com",
                full_name="安全负责人",
                hashed_password=hash_password("security123"),
                role=UserRole.SECURITY_OFFICER,
                department="安全部"
            )
            db.add(security)

        user = db.query(User).filter(User.username == "user").first()
        if not user:
            user = User(
                username="user",
                email="user@example.com",
                full_name="普通用户",
                hashed_password=hash_password("user123"),
                role=UserRole.USER,
                department="业务部"
            )
            db.add(user)

        db.commit()
    finally:
        db.close()


init_default_data()
