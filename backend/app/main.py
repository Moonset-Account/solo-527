from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.routers import api_router
from app import models
from app.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                email="admin@pharm.com",
                hashed_password=hash_password("admin123"),
                full_name="系统管理员",
                phone="13800000000",
                role=models.UserRole.ADMIN,
                department="信息中心",
                is_active=True
            )
            db.add(admin)

        purchaser = db.query(models.User).filter(models.User.username == "purchaser").first()
        if not purchaser:
            purchaser = models.User(
                username="purchaser",
                email="purchaser@pharm.com",
                hashed_password=hash_password("purchaser123"),
                full_name="采购专员",
                phone="13800000001",
                role=models.UserRole.PURCHASER,
                department="采购部",
                is_active=True
            )
            db.add(purchaser)

        warehouse = db.query(models.User).filter(models.User.username == "warehouse").first()
        if not warehouse:
            warehouse = models.User(
                username="warehouse",
                email="warehouse@pharm.com",
                hashed_password=hash_password("warehouse123"),
                full_name="库管员",
                phone="13800000002",
                role=models.UserRole.WAREHOUSE,
                department="仓储部",
                is_active=True
            )
            db.add(warehouse)

        manager = db.query(models.User).filter(models.User.username == "manager").first()
        if not manager:
            manager = models.User(
                username="manager",
                email="manager@pharm.com",
                hashed_password=hash_password("manager123"),
                full_name="部门经理",
                phone="13800000003",
                role=models.UserRole.MANAGER,
                department="运营部",
                is_active=True
            )
            db.add(manager)

        dict_types = [
            ("category", "antibiotic", "抗生素类", 1),
            ("category", "cardiovascular", "心血管类", 2),
            ("category", "digestive", "消化系统类", 3),
            ("category", "respiratory", "呼吸系统类", 4),
            ("category", "antipyretic", "解热镇痛类", 5),
            ("temperature_zone", "normal", "常温区", 1),
            ("temperature_zone", "cool", "阴凉区", 2),
            ("temperature_zone", "cold", "冷藏区", 3),
            ("temperature_zone", "frozen", "冷冻区", 4),
            ("abnormal_type", "expiry_risk", "效期异常", 1),
            ("abnormal_type", "damaged", "破损异常", 2),
            ("abnormal_type", "quantity_diff", "数量异常", 3),
            ("abnormal_type", "temperature", "温度异常", 4),
        ]
        for dtype, dcode, dvalue, sort in dict_types:
            existing = db.query(models.Dictionary).filter_by(
                dict_type=dtype, dict_code=dcode
            ).first()
            if not existing:
                db.add(models.Dictionary(
                    dict_type=dtype, dict_code=dcode, dict_value=dvalue,
                    sort_order=sort, is_active=True, created_by=admin.id if admin else 1
                ))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"初始化数据出错: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="医药批次追溯系统 - 采购计划员专用",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return JSONResponse(
        content={
            "name": settings.APP_NAME,
            "version": "1.0.0",
            "api_docs": "/docs",
            "health": "ok"
        }
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
