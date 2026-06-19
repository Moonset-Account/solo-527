from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "医药批次追溯系统"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "pharmadmin"
    DB_PASSWORD: str = "pharmadmin123"
    DB_NAME: str = "pharm_trace"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-this-to-a-long-random-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    NEAR_EXPIRE_DAYS: int = 180
    LOW_STOCK_THRESHOLD: int = 50
    REPORT_RETENTION_DAYS: int = 90

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
