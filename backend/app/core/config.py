from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', case_sensitive=True)
    
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "二手书回收定价看板"
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/book_recycling"
    )
    
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7


settings = Settings()
