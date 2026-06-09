from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.api.router import api_router
from app.models import user, department, time_slot, appointment, model_version, risk_score, sms, callback, feedback
from app.services.user_service import UserService
from app.services.business_service import SmsStrategyService
from app.services.data_import_service import DataImportService
from app.schemas.user import UserCreate
from app.ml.lgb_trainer import LightGBMTrainer


def init_database():
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    try:
        admin = UserService.get_user_by_username(db, "admin")
        if not admin:
            UserService.create_user(db, UserCreate(
                username="admin",
                email="admin@hospital.com",
                password="admin123",
                full_name="系统管理员",
                role="admin",
                is_active=True,
            ))
        operator = UserService.get_user_by_username(db, "operator")
        if not operator:
            UserService.create_user(db, UserCreate(
                username="operator",
                email="operator@hospital.com",
                password="operator123",
                full_name="运营人员",
                role="operator",
                is_active=True,
            ))
        ds = UserService.get_user_by_username(db, "datascientist")
        if not ds:
            UserService.create_user(db, UserCreate(
                username="datascientist",
                email="ds@hospital.com",
                password="ds123456",
                full_name="数据科学家",
                role="data_scientist",
                is_active=True,
            ))

        SmsStrategyService.init_default_templates(db)

        from app.models.department import Department
        if db.query(Department).count() == 0:
            default_depts = [
                {"code": "NEU", "name": "神经内科", "default_no_show_rate": 18},
                {"code": "CAR", "name": "心血管内科", "default_no_show_rate": 12},
                {"code": "PED", "name": "儿科", "default_no_show_rate": 25},
                {"code": "DER", "name": "皮肤科", "default_no_show_rate": 20},
                {"code": "ORT", "name": "骨科", "default_no_show_rate": 15},
                {"code": "Oph", "name": "眼科", "default_no_show_rate": 17},
                {"code": "GYN", "name": "妇产科", "default_no_show_rate": 22},
                {"code": "GEN", "name": "全科", "default_no_show_rate": 14},
            ]
            for d in default_depts:
                DataImportService.create_department(db, type('D', (), d)())
    finally:
        db.close()


def init_model_storage():
    os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_model_storage()
    init_database()
    yield
    pass


app = FastAPI(
    title="门诊爽约风险提醒AI平台",
    description="基于LightGBM的门诊爽约风险预测、干预策略与人工闭环工作台",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "门诊爽约风险提醒AI平台",
        "version": "1.0.0",
        "env": settings.APP_ENV,
    }


@app.get("/")
async def root():
    return {
        "message": "欢迎使用门诊爽约风险提醒AI平台",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
