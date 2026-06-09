from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, essays, feedback, classes, export
from app.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="校园作文反馈助手",
    description="服务语文教研组的AI作文反馈系统 - 结构/论据/错别字/表达建议分析",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(essays.router, prefix="/api/essays", tags=["作文管理"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["反馈管理"])
app.include_router(classes.router, prefix="/api/classes", tags=["班级统计"])
app.include_router(export.router, prefix="/api/export", tags=["数据导出"])


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_device": settings.MODEL_DEVICE,
        "low_confidence_threshold": settings.LOW_CONFIDENCE_THRESHOLD
    }
