from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, init_db
from app.redis_client import redis_client
from app.routers import auth, harvest, monitor, subsidy, sorting, reports, pages


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_db()
    yield
    from app.redis_client import close as redis_close
    redis_close()


app = FastAPI(
    title=settings.app_name,
    description="果园采摘环境监测站 - 农事采收、阈值告警、产量预测统一流程",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

app.include_router(pages.router, tags=["Pages"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(harvest.router, prefix="/api/harvest", tags=["Harvest & Batch"])
app.include_router(monitor.router, prefix="/api/monitor", tags=["Monitor & Alert"])
app.include_router(subsidy.router, prefix="/api/subsidy", tags=["Subsidy Voucher"])
app.include_router(sorting.router, prefix="/api/sorting", tags=["Sorting Difference"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports & Export"])


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "run_mode": settings.run_mode,
        "app": settings.app_name,
    }
