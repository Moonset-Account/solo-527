from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import time
from .config import settings
from .database import engine, Base
from .api.v1 import api_router
from .services import logger, notification_service
from .database import get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="实验室试剂库存管理系统 API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = '{0:.2f}'.format(process_time)
    
    if request.url.path not in ["/api/docs", "/api/redoc", "/api/openapi.json", "/health"]:
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Duration: {formatted_process_time}ms - "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
    
    response.headers["X-Process-Time"] = formatted_process_time
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "服务器内部错误",
            "message": str(exc) if settings.DEBUG else "请联系管理员"
        }
    )


@app.get("/health", tags=["系统"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    logger.info(f"{settings.APP_NAME} 启动成功")
    try:
        from .initial_data import init_db
        db = next(get_db())
        init_db(db)
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.warning(f"数据库初始化跳过: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"{settings.APP_NAME} 关闭")
