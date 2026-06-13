from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, tickets, knowledge_base, feedback_risk, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="青禾客服质检台 API",
    description="SaaS 客服知识库门户系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tickets.router, prefix="/api")
app.include_router(knowledge_base.router, prefix="/api")
app.include_router(feedback_risk.feedback_router, prefix="/api")
app.include_router(feedback_risk.risk_router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "青禾客服质检台 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
