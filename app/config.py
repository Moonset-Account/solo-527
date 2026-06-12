from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    app_name: str = "Orchard Monitor Station"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "orchard-monitor-secret-key-change-in-production"

    database_url: str = "sqlite:///./orchard_monitor.db"
    database_url_test: str = "sqlite:///./orchard_monitor_test.db"

    redis_url: str = "redis://localhost:6379/0"
    redis_url_test: str = "redis://localhost:6379/1"

    run_mode: Literal["production", "test", "demo"] = "production"

    access_token_expire_minutes: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
