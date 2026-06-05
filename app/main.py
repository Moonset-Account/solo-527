from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
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

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

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
    index_path = os.path.join(static_dir, "index.html")
    return FileResponse(index_path)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
