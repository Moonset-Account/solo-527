from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base, get_db
from .redis_client import redis_client
from .auth import get_current_user, create_access_token, verify_password
from .models import User, Order
from .routers import pages, api
from .services.admin_service import AdminService
from .services.order_service import OrderService


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    try:
        admin_service = AdminService(db)
        admin_service.init_test_users()
    except Exception as e:
        print(f"Init test users warning: {e}")
    finally:
        db.close()
    
    yield
    
    redis_client.close()


app = FastAPI(
    title="摄影师订单作品交付台",
    description="基于FastAPI、HTMX、PostgreSQL和Redis的摄影师订单作品交付管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session_id",
    max_age=86400 * 7,
    https_only=False,
    same_site="lax"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR.parent / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
templates.env.autoescape = True


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    public_paths = ["/login", "/static/", "/favicon.ico", "/docs", "/openapi.json", "/redoc"]
    
    if not any(path.startswith(p) for p in public_paths):
        session_id = request.cookies.get("session_id")
        if not session_id:
            if request.headers.get("HX-Request"):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "未登录或会话已过期"},
                    headers={"HX-Redirect": "/login"}
                )
            return RedirectResponse(url="/login", status_code=303)
        
        user_data = redis_client.get_session(session_id)
        if not user_data:
            if request.headers.get("HX-Request"):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "会话已过期"},
                    headers={"HX-Redirect": "/login"}
                )
            response = RedirectResponse(url="/login", status_code=303)
            response.delete_cookie("session_id")
            return response
        
        request.state.current_user = user_data
    
    response = await call_next(request)
    return response


app.include_router(pages.router)
app.include_router(api.router)


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if request.cookies.get("session_id"):
        user_data = redis_client.get_session(request.cookies.get("session_id"))
        if user_data:
            return RedirectResponse(url="/dashboard", status_code=303)
    
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "current_user": None,
            "active_page": "login"
        }
    )


@app.post("/login")
async def login(request: Request):
    form = await request.form()
    username = form.get("username")
    password = form.get("password")
    remember = form.get("remember") == "on"
    
    if not username or not password:
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "current_user": None,
                "error_message": "请输入用户名和密码",
                "active_page": "login"
            }
        )
    
    db = next(get_db())
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user or not verify_password(password, user.hashed_password):
            return templates.TemplateResponse(
                "login.html",
                {
                    "request": request,
                    "current_user": None,
                    "error_message": "用户名或密码错误",
                    "active_page": "login"
                }
            )
        
        if not user.is_active:
            return templates.TemplateResponse(
                "login.html",
                {
                    "request": request,
                    "current_user": None,
                    "error_message": "账号已被禁用，请联系管理员",
                    "active_page": "login"
                }
            )
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "email": user.email,
            "phone": user.phone,
            "is_test_account": user.is_test_account
        }
        
        ttl = 86400 * 7 if remember else 86400
        session_id = redis_client.set_session(user.id, user_data, ttl=ttl)
        
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role},
            expires_delta=timedelta(days=7) if remember else timedelta(days=1)
        )
        
        response = RedirectResponse(url="/dashboard", status_code=303)
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=ttl,
            httponly=True,
            samesite="lax",
            path="/"
        )
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            max_age=ttl,
            httponly=True,
            samesite="lax",
            path="/"
        )
        
        return response
    finally:
        db.close()


@app.get("/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id:
        redis_client.delete_session(session_id)
    
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie("session_id")
    response.delete_cookie("access_token")
    return response


@app.get("/favicon.ico")
async def favicon():
    return RedirectResponse(url="/static/images/favicon.ico")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    if request.headers.get("HX-Request"):
        return HTMLResponse(
            '<div class="alert alert-danger">页面不存在</div>',
            status_code=404
        )
    
    user_data = getattr(request.state, 'current_user', None)
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "current_user": user_data,
            "error_message": "页面不存在，请检查URL是否正确",
            "active_page": "login"
        },
        status_code=404
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    if request.headers.get("HX-Request"):
        return HTMLResponse(
            '<div class="alert alert-danger">服务器错误，请稍后重试</div>',
            status_code=500
        )
    
    user_data = getattr(request.state, 'current_user', None)
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "current_user": user_data,
            "error_message": "服务器错误，请稍后重试",
            "active_page": "login"
        },
        status_code=500
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
