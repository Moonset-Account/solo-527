from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/repair_dispatch"
    redis_url: str = "redis://localhost:6379/0"
    app_secret_key: str = "dev_secret_change_me"
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
