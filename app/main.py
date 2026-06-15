from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import Base, engine
from app.redis_client import init_redis, close_redis
from app.api.auth import router as auth_router
from app.api.public import router as public_router
from app.api.admin import router as admin_router
from app.api.business import router as business_router
from app.api.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    description="音乐演出座位库存管理系统 - FastAPI + HTMX + PostgreSQL + Redis",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.APP_DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATE_DIR) if os.path.isdir(TEMPLATE_DIR) else None


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def index_page(request: Request):
    if templates:
        return templates.TemplateResponse("index.html", {"request": request, "settings": settings})
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html lang="zh-CN"><head><meta charset="UTF-8"><title>{settings.APP_NAME}</title></head>
    <body><h1>{settings.APP_NAME}</h1>
    <p>API文档: <a href="/docs">/docs</a> | <a href="/admin">管理后台</a> | <a href="/events">前台购票</a></p>
    </body></html>""")


@app.get("/login", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request: Request):
    if templates:
        return templates.TemplateResponse("login.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>请登录</h1><p>使用 /login API 或查看 <a href='/docs'>API文档</a></p>")


@app.get("/events", response_class=HTMLResponse, include_in_schema=False)
async def events_page(request: Request):
    if templates:
        return templates.TemplateResponse("events.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>演出列表</h1>")


@app.get("/events/{event_id}/book", response_class=HTMLResponse, include_in_schema=False)
async def book_page(request: Request, event_id: int):
    if templates:
        return templates.TemplateResponse("booking.html", {"request": request, "event_id": event_id, "settings": settings})
    return HTMLResponse(f"<h1>选座购票 {event_id}</h1>")


@app.get("/orders", response_class=HTMLResponse, include_in_schema=False)
async def orders_page(request: Request):
    if templates:
        return templates.TemplateResponse("orders.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>我的订单</h1>")


@app.get("/admin", response_class=HTMLResponse, include_in_schema=False)
async def admin_dashboard_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/dashboard.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>管理后台</h1>")


@app.get("/admin/events", response_class=HTMLResponse, include_in_schema=False)
async def admin_events_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/events.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>场次管理</h1>")


@app.get("/admin/events/{event_id}/seats", response_class=HTMLResponse, include_in_schema=False)
async def admin_seats_page(request: Request, event_id: int):
    if templates:
        return templates.TemplateResponse("admin/seats.html", {"request": request, "event_id": event_id, "settings": settings})
    return HTMLResponse(f"<h1>座位管理 {event_id}</h1>")


@app.get("/admin/ticket-types", response_class=HTMLResponse, include_in_schema=False)
async def admin_ticket_types_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/ticket_types.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>票种管理</h1>")


@app.get("/admin/orders", response_class=HTMLResponse, include_in_schema=False)
async def admin_orders_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/orders.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>订单管理</h1>")


@app.get("/admin/registrations", response_class=HTMLResponse, include_in_schema=False)
async def admin_registrations_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/registrations.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>报名审核</h1>")


@app.get("/admin/refunds", response_class=HTMLResponse, include_in_schema=False)
async def admin_refunds_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/refunds.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>退款审批</h1>")


@app.get("/admin/configs", response_class=HTMLResponse, include_in_schema=False)
async def admin_configs_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/configs.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>配置管理</h1>")


@app.get("/admin/reports", response_class=HTMLResponse, include_in_schema=False)
async def admin_reports_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/reports.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>报表中心</h1>")


@app.get("/admin/alerts", response_class=HTMLResponse, include_in_schema=False)
async def admin_alerts_page(request: Request):
    if templates:
        return templates.TemplateResponse("admin/alerts.html", {"request": request, "settings": settings})
    return HTMLResponse("<h1>预警中心</h1>")


app.include_router(auth_router, prefix="/api")
app.include_router(public_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(business_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/api/health", tags=["系统"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}
