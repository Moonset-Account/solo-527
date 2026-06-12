from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "production"
    app_name: str = "青禾运维工单台"
    secret_key: str = "change-me-in-production"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/qinghe_ops"
    database_url_sync: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/qinghe_ops"
    redis_url: str = "redis://localhost:6379/0"
    access_token_expire_minutes: int = 480

    @property
    def is_test(self) -> bool:
        return self.app_env == "test"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
