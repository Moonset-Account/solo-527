from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./supplier_db.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "supplier-management-secret-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "app/static/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
