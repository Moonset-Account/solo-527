import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/dorm_repair"
    SQLITE_URL: str = "sqlite:///./dorm_repair.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dorm-repair-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    EXPORT_DIR: str = "exports"
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"]

    @property
    def effective_database_url(self) -> str:
        if os.environ.get("USE_POSTGRES"):
            return self.DATABASE_URL
        return self.SQLITE_URL

    model_config = {"env_file": ".env"}


settings = Settings()
