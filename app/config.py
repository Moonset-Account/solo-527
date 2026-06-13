from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "松石排课消课台"
    APP_ENV: str = "dev"
    APP_DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/songshi_db"
    TEST_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/songshi_test_db"

    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SESSION_DB: int = 1

    SECRET_KEY: str = "changeme_to_a_very_long_random_string_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ADMIN_DEFAULT_EMAIL: str = "admin@songshi.com"
    ADMIN_DEFAULT_PASSWORD: str = "Admin@123456"

    DEMO_MODE: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
