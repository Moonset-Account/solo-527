from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import engine, SessionLocal
from app.api import api_router
from app.models import Base
from app.services import UserService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        UserService.init_roles_and_permissions(db)
        UserService.init_admin_user(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "服务运行正常"}


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": "1.0.0"}
