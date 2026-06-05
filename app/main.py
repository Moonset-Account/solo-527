from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, dashboard, vendors, categories, booths, deposits, checkins, violations

app = FastAPI(
    title="手作市集摊位抽签和结算平台",
    description="摊主报名、摊位抽签、保证金和活动日签到统一管理系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(booths.router, prefix="/api")
app.include_router(deposits.router, prefix="/api")
app.include_router(checkins.router, prefix="/api")
app.include_router(violations.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "手作市集摊位抽签和结算平台",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
