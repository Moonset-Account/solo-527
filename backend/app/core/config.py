from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "高校机房能耗与故障看板 API"
    DEBUG: bool = True
    
    DATABASE_URL: str = "sqlite:///./energy_dashboard.db"
    
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"


settings = Settings()
