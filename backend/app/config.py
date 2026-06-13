from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://qinghe:qinghe123@localhost:5432/qinghe_qa"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "qinghe-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    SLA_RESPONSE_HOURS: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
