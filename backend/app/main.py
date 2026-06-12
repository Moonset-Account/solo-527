from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import Base, engine
from .api import auth, checklists, users, assignments, configs, reminders, dashboard, gaps

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(checklists.router, prefix="/api/checklists", tags=["检查清单"])
app.include_router(gaps.router, prefix="/api/gaps", tags=["合规缺口"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["分派管理"])
app.include_router(configs.router, prefix="/api/configs", tags=["系统配置"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["提醒通知"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["仪表盘"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}
