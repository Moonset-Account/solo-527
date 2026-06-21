from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, master, batch, inventory, inspection, rectification, finance, settings
from app.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="烘焙门店巡店整改系统 API",
    description="区域督导巡店、烘焙批次、报损、库存、整改、财务一体化管理系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(master.router, prefix="/api")
app.include_router(batch.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(inspection.router, prefix="/api")
app.include_router(rectification.router, prefix="/api")
app.include_router(finance.router, prefix="/api")
app.include_router(settings.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "烘焙门店巡店整改系统 API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    from app.database import SessionLocal
    from app.crud import crud_user, crud_setting, crud_store, crud_product, crud_ingredient, crud_inventory
    from app.models import UserRole, ModuleType
    from app.schemas import UserCreate, StoreCreate, ProductCreate, IngredientCreate, InventoryItemCreate, SystemSettingCreate

    db = SessionLocal()
    try:
        admin = crud_user.get_by_username(db, username="admin")
        if not admin:
            crud_user.create(db, obj_in=UserCreate(
                username="admin",
                full_name="系统管理员",
                email="admin@bakery.com",
                password="admin123",
                role=UserRole.ADMIN
            ))

        supervisor = crud_user.get_by_username(db, username="supervisor")
        if not supervisor:
            crud_user.create(db, obj_in=UserCreate(
                username="supervisor",
                full_name="区域督导",
                email="supervisor@bakery.com",
                password="123456",
                role=UserRole.SUPERVISOR
            ))

        store = crud_store.get_by_name(db, name="中心店")
        if not store:
            store = crud_store.create(db, obj_in=StoreCreate(
                name="中心店",
                address="北京市朝阳区建国路88号",
                phone="010-12345678"
            ))

        manager = crud_user.get_by_username(db, username="manager")
        if not manager:
            crud_user.create(db, obj_in=UserCreate(
                username="manager",
                full_name="店长",
                email="manager@bakery.com",
                password="123456",
                role=UserRole.STORE_MANAGER,
                store_id=store.id
            ))

        baker = crud_user.get_by_username(db, username="baker")
        if not baker:
            crud_user.create(db, obj_in=UserCreate(
                username="baker",
                full_name="烘焙师",
                email="baker@bakery.com",
                password="123456",
                role=UserRole.BAKER,
                store_id=store.id
            ))

        cashier = crud_user.get_by_username(db, username="cashier")
        if not cashier:
            crud_user.create(db, obj_in=UserCreate(
                username="cashier",
                full_name="收银员",
                email="cashier@bakery.com",
                password="123456",
                role=UserRole.CASHIER,
                store_id=store.id
            ))

        products = [
            {"name": "原味吐司", "sku": "P001", "category": "面包", "unit": "个", "standard_cost": 5.0, "selling_price": 12.0},
            {"name": "巧克力可颂", "sku": "P002", "category": "面包", "unit": "个", "standard_cost": 4.0, "selling_price": 10.0},
            {"name": "草莓蛋糕", "sku": "P003", "category": "蛋糕", "unit": "个", "standard_cost": 25.0, "selling_price": 68.0},
            {"name": "提拉米苏", "sku": "P004", "category": "蛋糕", "unit": "盒", "standard_cost": 15.0, "selling_price": 38.0},
            {"name": "蛋黄酥", "sku": "P005", "category": "点心", "unit": "个", "standard_cost": 3.0, "selling_price": 8.0},
        ]
        for p in products:
            if not crud_product.get_by_sku(db, sku=p["sku"]):
                crud_product.create(db, obj_in=ProductCreate(**p))

        ingredients = [
            {"name": "高筋面粉", "sku": "I001", "category": "粉类", "unit": "kg", "unit_price": 8.0, "min_stock": 50.0},
            {"name": "低筋面粉", "sku": "I002", "category": "粉类", "unit": "kg", "unit_price": 7.5, "min_stock": 50.0},
            {"name": "黄油", "sku": "I003", "category": "油脂", "unit": "kg", "unit_price": 45.0, "min_stock": 30.0},
            {"name": "白砂糖", "sku": "I004", "category": "糖类", "unit": "kg", "unit_price": 6.0, "min_stock": 40.0},
            {"name": "鸡蛋", "sku": "I005", "category": "蛋类", "unit": "kg", "unit_price": 12.0, "min_stock": 20.0},
            {"name": "淡奶油", "sku": "I006", "category": "乳制品", "unit": "L", "unit_price": 35.0, "min_stock": 15.0},
            {"name": "酵母", "sku": "I007", "category": "添加剂", "unit": "kg", "unit_price": 25.0, "min_stock": 5.0},
            {"name": "食盐", "sku": "I008", "category": "调料", "unit": "kg", "unit_price": 3.0, "min_stock": 10.0},
        ]
        for i in ingredients:
            ing = crud_ingredient.get_by_sku(db, sku=i["sku"])
            if not ing:
                ing = crud_ingredient.create(db, obj_in=IngredientCreate(**i))
            inv = crud_inventory.get_by_ingredient(db, store_id=store.id, ingredient_id=ing.id)
            if not inv:
                crud_inventory.create(db, obj_in=InventoryItemCreate(
                    store_id=store.id,
                    ingredient_id=ing.id,
                    quantity=ing.min_stock * 2,
                    min_stock=ing.min_stock
                ))

        existing_settings = crud_setting.get_multi(db)
        if not existing_settings:
            defaults = [
                (ModuleType.INVENTORY, "enabled", "true", "boolean", "库存管理模块"),
                (ModuleType.INVENTORY, "low_stock_threshold", "10", "number", "低库存预警阈值"),
                (ModuleType.INVENTORY, "auto_check_alerts", "true", "boolean", "自动检查库存预警"),
                (ModuleType.INSPECTION, "enabled", "true", "boolean", "巡店管理模块"),
                (ModuleType.INSPECTION, "default_score_threshold", "80", "number", "合格分数阈值"),
                (ModuleType.INSPECTION, "auto_create_rectification", "true", "boolean", "不合格项自动创建整改"),
                (ModuleType.RECTIFICATION, "enabled", "true", "boolean", "整改管理模块"),
                (ModuleType.RECTIFICATION, "default_deadline_days", "7", "integer", "整改默认期限(天)"),
                (ModuleType.CASH_FLOW, "enabled", "true", "boolean", "现金流水模块"),
                (ModuleType.BATCH, "enabled", "true", "boolean", "烘焙批次模块"),
                (ModuleType.LOSS, "enabled", "true", "boolean", "报损管理模块"),
                (ModuleType.LOSS, "require_handler", "true", "boolean", "报损需要处理人"),
                (ModuleType.LABOR_COST, "enabled", "true", "boolean", "人力成本模块"),
                (ModuleType.LABOR_COST, "default_hourly_rate", "20", "number", "默认时薪"),
                (ModuleType.LABOR_COST, "default_overtime_rate", "30", "number", "默认加班时薪"),
            ]
            for module, key, value, value_type, description in defaults:
                crud_setting.create(db, obj_in=SystemSettingCreate(
                    module=module, key=key, value=value, value_type=value_type, description=description
                ))

        db.commit()
    finally:
        db.close()
