from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.middleware import RequestLoggingMiddleware
from app.data.database import init_db, bootstrap_minimum_data
from app.api.v1.router import api_router

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info(f"{settings.APP_NAME} started. DB initialized.")
    bootstrap_minimum_data()
    logger.info(f"{settings.APP_NAME} bootstrap minimum data finished.")
    yield
    logger.info(f"{settings.APP_NAME} shutting down.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Internal Code Knowledge Q&A System",
        description=(
            "面向开发团队的内部代码知识库问答系统。"
            "支持代码仓库、接口文档、提交记录、测试说明、架构笔记的统一语义搜索和RAG问答。"
            "提供数据清洗审核、模型版本管理、审计日志、API限流、引用跳转和反馈机制。"
        ),
        version="1.0.0",
        debug=settings.DEBUG,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time-MS", "Retry-After"],
    )
    app.add_middleware(RequestLoggingMiddleware)

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "api_prefix": settings.API_V1_PREFIX,
        }

    @app.get("/health", tags=["Root"])
    async def health_check():
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "env": settings.APP_ENV,
            "default_model_version": settings.DEFAULT_MODEL_VERSION,
            "vector_store": settings.VECTOR_STORE_TYPE,
        }

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        rid = getattr(request.state, "request_id", "")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": rid,
                "error_type": type(exc).__name__,
                "message": str(exc) if settings.DEBUG else None,
            },
        )

    return app


app = create_app()


def main():
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        access_log=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )


if __name__ == "__main__":
    main()
