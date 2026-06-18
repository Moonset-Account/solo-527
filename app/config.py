from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "光伏电站收益核算器"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pv_station"
    DATABASE_ECHO: bool = False

    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300

    class Config:
        env_file = ".env"


settings = Settings()
