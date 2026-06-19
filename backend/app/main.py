from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .models import User, UserRole
from .auth import get_password_hash
from .routers import auth, counselors, schedules, appointments, config, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="心理咨询排班管理系统",
    description="服务调度员使用的心理咨询排班管理后台",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(counselors.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(config.router)
app.include_router(reports.router)


@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            hashed_password = get_password_hash("admin123")
            admin = User(
                username="admin",
                real_name="系统管理员",
                hashed_password=hashed_password,
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
        
        dispatcher = db.query(User).filter(User.username == "dispatcher").first()
        if not dispatcher:
            hashed_password = get_password_hash("dispatcher123")
            dispatcher = User(
                username="dispatcher",
                real_name="调度员",
                hashed_password=hashed_password,
                role=UserRole.DISPATCHER,
                is_active=True
            )
            db.add(dispatcher)
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"初始化用户失败: {e}")
    finally:
        db.close()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "心理咨询排班管理系统运行正常"}


@app.get("/")
async def root():
    return {
        "name": "心理咨询排班管理系统",
        "version": "1.0.0",
        "docs": "/docs",
        "default_accounts": [
            {"username": "admin", "password": "admin123", "role": "管理员"},
            {"username": "dispatcher", "password": "dispatcher123", "role": "调度员"}
        ]
    }
