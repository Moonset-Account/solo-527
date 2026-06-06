from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.core.exceptions import (
    BusinessException,
    business_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.core.database import engine, Base
from app.routers import auth, users, properties, room_statuses, cleaning_tasks, maintenance_orders, materials, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="民宿保洁和维修派单系统",
    description="帮助民宿运营经理处理房间分布在不同小区，退房后快速安排保洁和维修检查的管理系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(BusinessException, business_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(properties.router)
app.include_router(room_statuses.router)
app.include_router(cleaning_tasks.router)
app.include_router(maintenance_orders.router)
app.include_router(materials.router)
app.include_router(reports.router)


@app.get("/", tags=["根路径"])
def root():
    return {
        "name": "民宿保洁和维修派单系统",
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": "/api"
    }


@app.get("/health", tags=["健康检查"])
def health_check():
    return {"status": "healthy"}
