from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/marketplace"
    TEST_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/marketplace_test"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    NOTIFICATION_WEBHOOK_URL: str = "https://example.com/api/notify"

    class Config:
        env_file = ".env"


settings = Settings()
