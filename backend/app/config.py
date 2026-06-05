from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "实验室试剂库存管理系统"
    DEBUG: bool = True

    DB_USER: str = "reagent"
    DB_PASSWORD: str = "reagent123"
    DB_NAME: str = "reagent_inventory"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    MINIO_USER: str = "minioadmin"
    MINIO_PASSWORD: str = "minioadmin"
    MINIO_ENDPOINT: str = "localhost"
    MINIO_PORT: int = 9000
    MINIO_BUCKET: str = "reagent-attachments"
    MINIO_SECURE: bool = False

    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    NOTIFICATION_CHECK_INTERVAL: int = 300
    LOW_STOCK_THRESHOLD: int = 3
    EXPIRY_WARNING_DAYS: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def MINIO_ENDPOINT_WITH_PORT(self) -> str:
        return f"{self.MINIO_ENDPOINT}:{self.MINIO_PORT}"


settings = Settings()
