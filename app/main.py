from pathlib import Path
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager

from app.core.database import engine, Base, get_db
from app.core.redis_client import redis_client
from app.core.config import settings
from app.api import auth, pets, services, appointments, admin, health, config_analytics
from app.api.deps import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_client.connect()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await redis_client.close()
    await engine.dispose()


app = FastAPI(title="宠物洗护预约商城", lifespan=lifespan)

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.include_router(auth.router, prefix="/api")
app.include_router(pets.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(config_analytics.router, prefix="/api")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    try:
        user = await get_current_user(request)
        if user.role in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/admin/dashboard")
        return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@app.get("/customer/dashboard", response_class=HTMLResponse)
async def customer_dashboard(request: Request):
    try:
        user = await get_current_user(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "customer/dashboard.html",
        {"request": request, "user": user}
    )


@app.get("/customer/services", response_class=HTMLResponse)
async def customer_services(request: Request):
    try:
        user = await get_current_user(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "customer/services.html",
        {"request": request, "user": user}
    )


@app.get("/customer/appointments", response_class=HTMLResponse)
async def customer_appointments(request: Request):
    try:
        user = await get_current_user(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "customer/appointments.html",
        {"request": request, "user": user}
    )


@app.get("/customer/pets", response_class=HTMLResponse)
async def customer_pets(request: Request):
    try:
        user = await get_current_user(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "customer/pets.html",
        {"request": request, "user": user}
    )


@app.get("/admin/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/dashboard.html",
        {"request": request, "user": user}
    )


@app.get("/admin/appointments", response_class=HTMLResponse)
async def admin_appointments(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/appointments.html",
        {"request": request, "user": user}
    )


@app.get("/admin/cages", response_class=HTMLResponse)
async def admin_cages(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/cages.html",
        {"request": request, "user": user}
    )


@app.get("/admin/boardings", response_class=HTMLResponse)
async def admin_boardings(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/boardings.html",
        {"request": request, "user": user}
    )


@app.get("/admin/health", response_class=HTMLResponse)
async def admin_health(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/health.html",
        {"request": request, "user": user}
    )


@app.get("/admin/anomalies", response_class=HTMLResponse)
async def admin_anomalies(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager", "staff"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/anomalies.html",
        {"request": request, "user": user}
    )


@app.get("/admin/configs", response_class=HTMLResponse)
async def admin_configs(request: Request):
    try:
        user = await get_current_user(request)
        if user.role not in ["admin", "manager"]:
            return RedirectResponse(url="/customer/dashboard")
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        "admin/configs.html",
        {"request": request, "user": user}
    )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "env": settings.APP_ENV}
