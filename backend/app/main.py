from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import analytics, export
import uvicorn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="电商退货分析看板 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(export.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "退货分析看板API运行正常"}


if __name__ == "__main__":
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
