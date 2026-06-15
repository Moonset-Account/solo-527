from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/clinic"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "clinic-secret-key"
    debug: bool = True

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
