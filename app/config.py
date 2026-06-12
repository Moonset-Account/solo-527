from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    app_name: str = "Orchard Monitor Station"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "orchard-monitor-secret-key-change-in-production"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/orchard_monitor"
    database_url_test: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/orchard_monitor_test"

    redis_url: str = "redis://localhost:6379/0"
    redis_url_test: str = "redis://localhost:6379/1"

    run_mode: Literal["production", "test", "demo"] = "production"

    access_token_expire_minutes: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
