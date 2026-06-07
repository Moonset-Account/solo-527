from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

try:
    from backend.api.routes import router as analytics_router
except ImportError:
    from api.routes import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up Gym Retention Analytics API...")
    yield
    print("Shutting down...")

app = FastAPI(
    title="健身房会员训练留存分析API",
    description="提供健身房会员留存分析、课程热度、教练负载等数据接口",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)

@app.get("/")
def root():
    return {
        "name": "健身房会员训练留存分析API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
