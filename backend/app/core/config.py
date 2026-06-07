from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "高校机房能耗与故障看板"
    DEBUG: bool = True
    
    DB_TYPE: str = os.getenv("DB_TYPE", "sqlite")
    
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_NAME: str = os.getenv("DB_NAME", "energy_dashboard")
    
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "./energy_dashboard.db")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DB_TYPE == "postgresql":
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"sqlite:///{self.SQLITE_PATH}"
    
    CORS_ORIGINS: list = ["*"]


settings = Settings()
