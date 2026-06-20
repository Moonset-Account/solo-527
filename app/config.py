from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "美容院作品展示管理系统"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/beauty_salon"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-change-in-production-very-long-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CASH_DIFF_WARNING_THRESHOLD: float = 50.0
    CASH_DIFF_ALERT_THRESHOLD: float = 200.0

    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"


settings = Settings()
