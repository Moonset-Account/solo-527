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
from app.schemas.data import DepartmentCreate
from app.ml.lgb_trainer import LightGBMTrainer
import traceback


def init_database():
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    try:
        admin = UserService.get_user_by_username(db, "admin")
        if not admin:
            try:
                UserService.create_user(db, UserCreate(
                    username="admin",
                    email="admin@hospital.com",
                    password="admin123",
                    full_name="系统管理员",
                    role="admin",
                    is_active=True,
                ))
            except Exception as e:
                print(f"[init] 创建 admin 用户失败: {e}")
        operator = UserService.get_user_by_username(db, "operator")
        if not operator:
            try:
                UserService.create_user(db, UserCreate(
                    username="operator",
                    email="operator@hospital.com",
                    password="operator123",
                    full_name="运营人员",
                    role="operator",
                    is_active=True,
                ))
            except Exception as e:
                print(f"[init] 创建 operator 用户失败: {e}")
        ds = UserService.get_user_by_username(db, "datascientist")
        if not ds:
            try:
                UserService.create_user(db, UserCreate(
                    username="datascientist",
                    email="ds@hospital.com",
                    password="ds123456",
                    full_name="数据科学家",
                    role="data_scientist",
                    is_active=True,
                ))
            except Exception as e:
                print(f"[init] 创建 datascientist 用户失败: {e}")

        try:
            SmsStrategyService.init_default_templates(db)
        except Exception as e:
            print(f"[init] 初始化短信模板失败: {e}")

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
                try:
                    DataImportService.create_department(db, DepartmentCreate(**d))
                except Exception as e:
                    print(f"[init] 创建科室 {d.get('code')} 失败: {e}")
    except Exception as e:
        print(f"[init] 数据库初始化异常 (服务继续启动): {e}")
        traceback.print_exc()
    finally:
        try:
            db.close()
        except Exception:
            pass


def init_model_storage():
    try:
        os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
    except Exception as e:
        print(f"[init] 存储目录初始化失败: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_model_storage()
    except Exception as e:
        print(f"[lifespan] 存储初始化异常 (忽略): {e}")
    try:
        init_database()
    except Exception as e:
        print(f"[lifespan] 数据库初始化异常 (忽略，服务继续启动): {e}")
        traceback.print_exc()
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
