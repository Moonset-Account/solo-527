from contextlib import asynccontextmanager
from datetime import date
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

from app.config import settings
from app.database import engine, Base
from app.redis import init_redis, close_redis
from app.middleware import RequestLoggingMiddleware
from app.routers import all_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.APP_DEBUG,
)

app.add_middleware(RequestLoggingMiddleware)

for router in all_routers:
    app.include_router(router)

templates = Jinja2Templates(directory="app/templates")

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/", response_class=HTMLResponse)
async def root():
    return RedirectResponse(url="/mall")


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/admin/login", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request})


@app.get("/mall", response_class=HTMLResponse)
async def mall_page(request: Request):
    return templates.TemplateResponse("mall.html", {"request": request})


@app.get("/my-coupons", response_class=HTMLResponse)
async def my_coupons_page(request: Request):
    return templates.TemplateResponse("my_coupons.html", {"request": request})


@app.get("/my-benefits", response_class=HTMLResponse)
async def my_benefits_page(request: Request):
    return templates.TemplateResponse("my_benefits.html", {"request": request})


@app.get("/my-redemptions", response_class=HTMLResponse)
async def my_redemptions_page(request: Request):
    return templates.TemplateResponse("my_redemptions.html", {"request": request})


@app.get("/admin/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    return templates.TemplateResponse("admin_dashboard.html", {"request": request})


@app.get("/admin/members", response_class=HTMLResponse)
async def admin_members(request: Request):
    return templates.TemplateResponse("admin_members.html", {"request": request})


@app.get("/admin/coupons", response_class=HTMLResponse)
async def admin_coupons(request: Request):
    return templates.TemplateResponse("admin_coupons.html", {"request": request})


@app.get("/admin/products", response_class=HTMLResponse)
async def admin_products(request: Request):
    return templates.TemplateResponse("admin_products.html", {"request": request})


@app.get("/admin/benefits", response_class=HTMLResponse)
async def admin_benefits(request: Request):
    return templates.TemplateResponse("admin_benefits.html", {"request": request})


@app.get("/admin/crowds", response_class=HTMLResponse)
async def admin_crowds(request: Request):
    return templates.TemplateResponse("admin_crowds.html", {"request": request})


@app.get("/admin/reach-tasks", response_class=HTMLResponse)
async def admin_reach_tasks(request: Request):
    return templates.TemplateResponse("admin_reach_tasks.html", {"request": request})


@app.get("/admin/redemptions", response_class=HTMLResponse)
async def admin_redemptions(request: Request):
    return templates.TemplateResponse("admin_redemptions.html", {"request": request})


@app.get("/admin/cost-reports", response_class=HTMLResponse)
async def admin_cost_reports(request: Request):
    today = date.today().isoformat()
    return templates.TemplateResponse("admin_cost_reports.html", {"request": request, "today": today})


@app.get("/admin/dicts", response_class=HTMLResponse)
async def admin_dicts(request: Request):
    return templates.TemplateResponse("admin_dicts.html", {"request": request})


@app.get("/admin/notifications", response_class=HTMLResponse)
async def admin_notifications(request: Request):
    return templates.TemplateResponse("admin_notifications.html", {"request": request})


@app.get("/admin/logs", response_class=HTMLResponse)
async def admin_logs(request: Request):
    return templates.TemplateResponse("admin_logs.html", {"request": request})


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
