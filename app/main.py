from contextlib import asynccontextmanager
from datetime import datetime, date
from typing import Optional

from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.config import settings
from app.database import Base, engine, get_db, async_session
from app.security import get_current_user
from app.models import User, UserRole, UserStatus, DataEnvironment, Campus, Course
from app.security import hash_password

from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.courses import router as courses_router
from app.routers.schedules import router as schedules_router
from app.routers.homework import router as homework_router, notif_router
from app.routers.reports import lead_router, report_router, audit_router
from app.routers.stats import stats_router
from app.routers.partials import partials_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 {settings.APP_NAME} 启动中...")
    print(f"📊 环境: {settings.APP_ENV} | 演示模式: {settings.DEMO_MODE}")
    print(f"🗄️  数据库: {settings.DATABASE_URL}")

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""))
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 数据库表结构已同步")

    async with async_session() as session:
        await init_default_data(session)

    yield

    from app.redis_client import RedisClient
    await RedisClient.close()
    await engine.dispose()
    print("👋 服务已关闭")


app = FastAPI(
    title=settings.APP_NAME,
    description="少儿编程班排课消课管理系统 - FastAPI + HTMX + PostgreSQL + Redis",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.APP_DEBUG,
)


templates = Jinja2Templates(directory="app/templates")

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(courses_router)
app.include_router(schedules_router)
app.include_router(homework_router)
app.include_router(notif_router)
app.include_router(lead_router)
app.include_router(report_router)
app.include_router(audit_router)
app.include_router(stats_router)
app.include_router(partials_router)


async def init_default_data(db: AsyncSession):
    roles_to_create = [
        {
            "email": settings.ADMIN_DEFAULT_EMAIL,
            "password": settings.ADMIN_DEFAULT_PASSWORD,
            "username": "超级管理员",
            "real_name": "系统超管",
            "role": UserRole.SUPER_ADMIN,
        },
        {
            "email": "principal@songshi.com",
            "password": "Test@123456",
            "username": "校长",
            "real_name": "张校长",
            "role": UserRole.PRINCIPAL,
        },
        {
            "email": "staff@songshi.com",
            "password": "Test@123456",
            "username": "教务老师",
            "real_name": "李教务",
            "role": UserRole.STAFF,
        },
        {
            "email": "teacher@songshi.com",
            "password": "Test@123456",
            "username": "授课老师",
            "real_name": "王老师",
            "role": UserRole.TEACHER,
        },
        {
            "email": "admin_user@songshi.com",
            "password": "Test@123456",
            "username": "管理员",
            "real_name": "赵管理员",
            "role": UserRole.ADMIN,
        },
    ]

    created_any = False
    for user_data in roles_to_create:
        result = await db.execute(select(User).where(User.email == user_data["email"]))
        existing = result.scalar_one_or_none()
        if not existing:
            new_user = User(
                email=user_data["email"],
                username=user_data["username"],
                real_name=user_data["real_name"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"],
                status=UserStatus.ACTIVE,
                is_demo=False,
                environment=DataEnvironment.PRODUCTION,
            )
            db.add(new_user)
            created_any = True

    default_campuses = [
        {"name": "松石编程·朝阳校区", "address": "北京市朝阳区建国路88号", "phone": "010-88880001"},
        {"name": "松石编程·海淀校区", "address": "北京市海淀区中关村大街1号", "phone": "010-88880002"},
    ]
    for campus_data in default_campuses:
        result = await db.execute(select(Campus).where(Campus.name == campus_data["name"]))
        if not result.scalar_one_or_none():
            db.add(Campus(**campus_data, is_demo=False, environment=DataEnvironment.PRODUCTION))
            created_any = True

    default_courses = [
        {"name": "Scratch图形化编程入门", "code": "SCR-001", "category": "Scratch", "level": "入门",
         "description": "适合6-9岁零基础孩子，通过积木式编程培养逻辑思维",
         "total_hours": 48, "default_sessions": 24, "default_duration": 90, "price": 4800.00},
        {"name": "Python编程基础", "code": "PYT-001", "category": "Python", "level": "进阶",
         "description": "适合9-12岁，学习Python语法，制作游戏和小程序",
         "total_hours": 64, "default_sessions": 32, "default_duration": 120, "price": 7680.00},
        {"name": "C++信息学奥赛", "code": "CPP-001", "category": "C++", "level": "竞赛",
         "description": "适合10-15岁，备战NOIP/CSP-J/S信息学竞赛",
         "total_hours": 96, "default_sessions": 48, "default_duration": 150, "price": 14400.00},
        {"name": "机器人编程与搭建", "code": "ROB-001", "category": "机器人", "level": "入门",
         "description": "适合7-10岁，动手搭建+编程控制，培养工程思维",
         "total_hours": 36, "default_sessions": 18, "default_duration": 120, "price": 5400.00},
    ]
    from app.models import CourseStatus
    for course_data in default_courses:
        result = await db.execute(select(Course).where(Course.code == course_data["code"]))
        if not result.scalar_one_or_none():
            db.add(Course(**course_data, status=CourseStatus.PUBLISHED,
                          is_demo=False, environment=DataEnvironment.PRODUCTION))
            created_any = True

    if created_any:
        print("🎯 初始数据已创建")
    print(f"🔑 默认账号: {settings.ADMIN_DEFAULT_EMAIL} / {settings.ADMIN_DEFAULT_PASSWORD}")


@app.get("/", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=302)

    hour = datetime.now().hour
    if hour < 6:
        greeting = "凌晨好"
    elif hour < 12:
        greeting = "早上好"
    elif hour < 14:
        greeting = "中午好"
    elif hour < 18:
        greeting = "下午好"
    else:
        greeting = "晚上好"

    today_str = datetime.now().strftime("%Y年%m月%d日 %A")
    weekdays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
    today_str = datetime.now().strftime("%Y年%m月%d日 ") + weekdays[datetime.now().weekday()]

    ctx = {
        "request": request,
        "current_user": user,
        "active_page": "dashboard",
        "greeting": greeting,
        "today": today_str,
    }
    return templates.TemplateResponse("dashboard.html", ctx)


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})


@app.get("/schedules", response_class=HTMLResponse)
async def schedules_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("schedules.html", {
        "request": request, "current_user": user, "active_page": "schedules"
    })


@app.get("/courses", response_class=HTMLResponse)
async def courses_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("courses.html", {
        "request": request, "current_user": user, "active_page": "courses"
    })


@app.get("/students", response_class=HTMLResponse)
async def students_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("students.html", {
        "request": request, "current_user": user, "active_page": "students"
    })


@app.get("/leads", response_class=HTMLResponse)
async def leads_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("leads.html", {
        "request": request, "current_user": user, "active_page": "leads"
    })


@app.get("/reports", response_class=HTMLResponse)
async def reports_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    today = date.today()
    return templates.TemplateResponse("reports.html", {
        "request": request, "current_user": user, "active_page": "reports",
        "current_year": today.year, "current_month": today.month,
    })


@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    if user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        return HTMLResponse("<h2>权限不足</h2><p>仅管理员可访问</p>")
    return templates.TemplateResponse("admin.html", {
        "request": request, "current_user": user, "active_page": "admin"
    })


@app.get("/notifications", response_class=HTMLResponse)
async def notifications_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("notifications.html", {
        "request": request, "current_user": user, "active_page": "notifications"
    })


@app.get("/audit", response_class=HTMLResponse)
async def audit_page(request: Request):
    try:
        user = await get_current_user(request, token=None)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("audit.html", {
        "request": request, "current_user": user, "active_page": "audit"
    })


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "env": settings.APP_ENV,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if request.headers.get("HX-Request") == "true":
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            resp = HTMLResponse('<script>window.location.href="/login"</script>')
            resp.delete_cookie("access_token")
            resp.delete_cookie("user_info")
            return resp
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            return HTMLResponse(f'<div class="alert alert-error">⚠️ {exc.detail}</div>')
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "error": True})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_DEBUG,
    )
