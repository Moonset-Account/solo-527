from __future__ import annotations

import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from apscheduler.schedulers.background import BackgroundScheduler

from app import __version__
from app.config import settings
from app.core.database import init_db, get_sync_session
from app.models.user import User, UserRole
from app.models.task import Task
from app.api.v1.router import api_v1_router
from app.services.alerting import AlertManager, DEFAULT_POLICIES
from app.schemas.base import BaseResponse


logger = logging.getLogger("app.main")
_logger_configured = False


def _setup_logging():
    global _logger_configured
    if _logger_configured:
        return
    _logger_configured = True

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    handlers = [logging.StreamHandler(sys.stdout)]
    try:
        log_dir = os.path.dirname(settings.LOG_FILE)
        os.makedirs(log_dir, exist_ok=True)
        handlers.append(logging.FileHandler(settings.LOG_FILE, encoding="utf-8"))
    except Exception:
        pass

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=handlers,
        force=True,
    )


_setup_logging()


def _init_default_user():
    db = get_sync_session()
    try:
        from sqlalchemy import select

        result = db.execute(select(User).where(User.id == 1))
        user = result.scalar_one_or_none()
        if not user:
            default_user = User(
                id=1,
                username="system",
                email="system@contractrisk.ai",
                full_name="System Default",
                role=UserRole.LEGAL_ASSISTANT,
                is_active=True,
            )
            db.add(default_user)
            db.commit()
            logger.info("已创建默认用户 id=1 (LEGAL_ASSISTANT)")
        else:
            logger.debug("默认用户已存在 id=1")
    except Exception as e:
        logger.warning(f"初始化默认用户失败（可能表不存在）: {e}")
        db.rollback()
    finally:
        db.close()


def _init_alert_policies() -> AlertManager:
    db = get_sync_session()
    am = AlertManager(
        db=db,
        webhook_url=settings.ALERT_WEBHOOK_URL,
        email_config=settings.get_alert_email_config(),
    )
    for policy in DEFAULT_POLICIES:
        try:
            am.register_policy(policy)
        except Exception as e:
            logger.warning(f"注册告警策略 {policy.metric_name} 失败: {e}")
    logger.info(f"已注册 {len(DEFAULT_POLICIES)} 条默认告警策略")
    return am


def _run_synthetic_checks():
    try:
        db = get_sync_session()
        am = AlertManager(
            db=db,
            webhook_url=settings.ALERT_WEBHOOK_URL,
            email_config=settings.get_alert_email_config(),
        )
        try:
            triggered = 0
            for fn_name, fn in [
                ("tasks_health", am.synthetic_check_tasks_health),
                ("latency", am.synthetic_check_latency),
                ("error_samples", am.synthetic_check_error_samples),
            ]:
                try:
                    r = fn()
                    if r:
                        triggered += 1
                        logger.info(f"[定时巡检] {fn_name} 触发告警")
                except Exception as e:
                    logger.exception(f"[定时巡检] {fn_name} 执行失败: {e}")
            logger.info(f"[定时巡检] 完成，触发告警数={triggered}")
        finally:
            try:
                am.db.close()
            except Exception:
                pass
    except Exception as e:
        logger.exception(f"[定时巡检] 整体失败: {e}")


scheduler = BackgroundScheduler(timezone="UTC")
scheduler.add_job(
    _run_synthetic_checks,
    "interval",
    minutes=15,
    id="synthetic_health_check",
    replace_existing=True,
    next_run_time=datetime.utcnow(),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info(f"{settings.APP_NAME} v{__version__} 启动中...")
    logger.info("=" * 60)

    logger.info("[1/4] 初始化数据库表结构...")
    try:
        init_db()
        logger.info("[1/4] ✅ 数据库表结构初始化完成")
    except Exception as e:
        logger.exception(f"[1/4] ❌ 数据库初始化失败: {e}")

    logger.info("[2/4] 初始化默认用户...")
    try:
        _init_default_user()
        logger.info("[2/4] ✅ 默认用户初始化完成")
    except Exception as e:
        logger.exception(f"[2/4] ❌ 默认用户初始化失败: {e}")

    logger.info("[3/4] 注册默认告警策略...")
    try:
        am = _init_alert_policies()
        app.state.alert_manager = am
        logger.info("[3/4] ✅ 告警策略注册完成")
    except Exception as e:
        logger.exception(f"[3/4] ❌ 告警策略注册失败: {e}")
        app.state.alert_manager = None

    logger.info("[4/4] 启动定时健康检查调度器（每15分钟）...")
    try:
        if not scheduler.running:
            scheduler.start()
            logger.info("[4/4] ✅ APScheduler 调度器启动完成")
        else:
            logger.info("[4/4] ✅ APScheduler 调度器已在运行")
    except Exception as e:
        logger.exception(f"[4/4] ❌ 调度器启动失败: {e}")

    logger.info("=" * 60)
    logger.info(f"{settings.APP_NAME} 启动完成!")
    logger.info(f"API:    http://localhost:8000{settings.API_PREFIX}")
    logger.info(f"Docs:   http://localhost:8000/docs")
    logger.info(f"ReDoc:  http://localhost:8000/redoc")
    logger.info(f"Health: http://localhost:8000/healthz")
    logger.info("=" * 60)

    yield

    logger.info("正在关闭应用...")
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler 调度器已停止")
    except Exception:
        pass
    try:
        if hasattr(app.state, "alert_manager") and app.state.alert_manager:
            try:
                app.state.alert_manager.db.close()
            except Exception:
                pass
    except Exception:
        pass
    logger.info("应用已关闭")


app = FastAPI(
    title=settings.APP_NAME,
    version=__version__,
    description="""
# ContractRiskAI - 智能合同风险审核平台

基于大语言模型的合同解析、风险识别、智能问答与MLOps全流程管理系统。

## 主要功能

- 📄 **合同解析**：PDF/DOCX/TXT → 结构化元信息 + 条款切片
- ⚠️ **风险检测**：多维度规则 + LLM，识别高风险条款
- 💬 **智能问答**：RAG 多轮对话，精准定位合同条款
- 📊 **数据集管理**：版本链 + 审核流 + 导入导出 + 回滚
- 🧪 **MLOps**：模型注册、AB测试、评估、显著性分析
- 🚨 **告警监控**：失败率/延迟/模型衰减/错误样本多通道告警

## 认证

当前版本为开发模式，使用 Mock 用户（id=1, role=LEGAL_ASSISTANT）。
生产环境请启用 JWT 认证。
""",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "ContractRiskAI Team",
        "email": "support@contractrisk.ai",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)


if settings.APP_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8080",
            "https://*.contractrisk.ai",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
    compresslevel=6,
)


@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start_time = datetime.utcnow()
    logger.info(
        f"[{request_id[:8]}] ← {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.exception(
            f"[{request_id[:8]}] ✗ {type(exc).__name__}: {exc} ({duration_ms:.0f}ms)"
        )
        raise

    duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
    response.headers["X-Request-ID"] = request_id
    logger.info(
        f"[{request_id[:8]}] → {response.status_code} "
        f"{request.method} {request.url.path} ({duration_ms:.0f}ms)"
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.warning(
        f"[{request_id[:8]}] 请求验证失败: {exc.errors()}"
    )
    resp = BaseResponse(
        code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message=f"请求参数校验失败: {'; '.join(e.get('msg', '') for e in exc.errors()[:3])}",
        data={"errors": exc.errors()},
        request_id=request_id,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=resp.model_dump(mode="json"),
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.warning(
        f"[{request_id[:8]}] Pydantic 验证失败: {exc.errors()}"
    )
    resp = BaseResponse(
        code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message=f"数据验证失败: {'; '.join(e.get('msg', '') for e in exc.errors()[:3])}",
        data={"errors": exc.errors()},
        request_id=request_id,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=resp.model_dump(mode="json"),
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.exception(
        f"[{request_id[:8]}] 未处理异常 {type(exc).__name__}: {exc}"
    )
    if isinstance(exc, ValueError) and "not found" in str(exc).lower():
        http_status = status.HTTP_404_NOT_FOUND
        code = http_status
    else:
        http_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        code = http_status
    resp = BaseResponse(
        code=code,
        message=str(exc) if settings.DEBUG else "服务器内部错误，请稍后重试",
        data={"error_type": type(exc).__name__} if settings.DEBUG else None,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=http_status,
        content=resp.model_dump(mode="json"),
        headers={"X-Request-ID": request_id},
    )


static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    index_path = static_dir / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text(encoding="utf-8"), status_code=200)
    return HTMLResponse(
        content=f"""
        <html><head><title>{settings.APP_NAME}</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:80px">
            <h1 style="color:#667eea">{settings.APP_NAME} v{__version__}</h1>
            <p>API 服务运行中</p>
            <p><a href="/docs">Swagger UI</a> | <a href="/redoc">ReDoc</a> | <a href="/healthz">Health</a></p>
        </body></html>
        """,
        status_code=200,
    )


@app.get("/healthz", tags=["System"], summary="Liveness 健康检查")
async def healthz():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": __version__,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": {
            "liveness": "pass",
        },
    }


@app.get("/readyz", tags=["System"], summary="Readiness 就绪检查")
async def readyz(request: Request):
    checks: dict[str, Any] = {"readiness": "pass"}

    try:
        from sqlalchemy import select, text

        db = get_sync_session()
        try:
            db.execute(text("SELECT 1"))
            checks["database"] = "pass"
        except Exception as e:
            checks["database"] = f"fail: {e}"
        finally:
            db.close()
    except Exception as e:
        checks["database"] = f"fail: {e}"

    am_ok = getattr(request.app.state, "alert_manager", None) is not None
    checks["alert_manager"] = "pass" if am_ok else "warn: not initialized"

    all_pass = all(v == "pass" for v in checks.values())
    code = 200 if all_pass else 503

    return JSONResponse(
        status_code=code,
        content={
            "status": "ready" if all_pass else "not_ready",
            "service": settings.APP_NAME,
            "version": __version__,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "checks": checks,
        },
    )


@app.get("/metrics", tags=["System"], summary="Prometheus 指标端点（占位）")
async def metrics():
    from sqlalchemy import select, func

    task_stats = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
    try:
        db = get_sync_session()
        try:
            from app.models.task import Task as DBTask, TaskStatus

            for st in TaskStatus:
                try:
                    r = db.execute(
                        select(func.count(DBTask.id)).where(DBTask.status == st)
                    )
                    task_stats[st.value] = r.scalar_one() or 0
                except Exception:
                    pass
        finally:
            db.close()
    except Exception:
        pass

    lines = [
        f"# HELP app_info Application info",
        f"# TYPE app_info gauge",
        f'app_info{{version="{__version__}",app="{settings.APP_NAME}",env="{settings.APP_ENV}"}} 1',
        f"",
        f"# HELP tasks_total Number of tasks by status",
        f"# TYPE tasks_total gauge",
    ]
    for st, cnt in task_stats.items():
        lines.append(f'tasks_total{{status="{st}"}} {cnt}')

    lines.extend([
        f"",
        f"# HELP uptime_seconds Uptime in seconds",
        f"# TYPE uptime_seconds counter",
        f"uptime_seconds {(datetime.utcnow().timestamp()):.0f}",
    ])

    return JSONResponse(
        content={
            "app": settings.APP_NAME,
            "version": __version__,
            "env": settings.APP_ENV,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "task_stats": task_stats,
            "prometheus_format": "\n".join(lines),
        },
        headers={"Content-Type": "application/json; charset=utf-8"},
    )


app.include_router(api_v1_router)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return JSONResponse(status_code=404, content={"detail": "No favicon"})
