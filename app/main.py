from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.config import get_settings
from app.database import init_db
from app.middleware.audit import AuditMiddleware
from app.routers import auth, work_orders, dashboard, assets, change_windows, audit, reports
from app.routers.auth import get_current_user
import os

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(AuditMiddleware)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(auth.router)
app.include_router(work_orders.router)
app.include_router(dashboard.router)
app.include_router(assets.router)
app.include_router(change_windows.router)
app.include_router(audit.router)
app.include_router(reports.router)


@app.get("/")
async def index(request: Request):
    user = await get_current_user(request)
    if not user:
        return RedirectResponse(url="/auth/login", status_code=302)
    return RedirectResponse(url="/dashboard", status_code=302)
