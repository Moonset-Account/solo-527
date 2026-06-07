from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .routers import books_router, recycle_records_router, analytics_router, pricing_router, export_router
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表初始化成功")
    except Exception as e:
        logger.warning(f"数据库初始化失败（如果数据库未启动可忽略）: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
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

app.include_router(books_router, prefix=settings.API_V1_STR)
app.include_router(recycle_records_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(pricing_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "二手书回收定价看板 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
