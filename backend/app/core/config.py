from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "高校机房能耗与故障看板"
    DEBUG: bool = True
    
    DB_TYPE: str = os.getenv("DB_TYPE", "auto")
    
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_NAME: str = os.getenv("DB_NAME", "energy_dashboard")
    
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "./energy_dashboard.db")
    
    _resolved_db_type: Optional[str] = None
    
    @property
    def RESOLVED_DB_TYPE(self) -> str:
        if self._resolved_db_type:
            return self._resolved_db_type
            
        if self.DB_TYPE in ("postgresql", "sqlite"):
            self._resolved_db_type = self.DB_TYPE
            return self._resolved_db_type
        
        if self.DB_TYPE == "auto":
            try:
                import psycopg2
                conn = psycopg2.connect(
                    host=self.DB_HOST,
                    port=self.DB_PORT,
                    user=self.DB_USER,
                    password=self.DB_PASSWORD,
                    dbname=self.DB_NAME,
                    connect_timeout=2
                )
                conn.close()
                self._resolved_db_type = "postgresql"
            except Exception:
                self._resolved_db_type = "sqlite"
        
        return self._resolved_db_type
    
    @property
    def DATABASE_URL(self) -> str:
        db_type = self.RESOLVED_DB_TYPE
        if db_type == "postgresql":
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return f"sqlite:///{self.SQLITE_PATH}"
    
    CORS_ORIGINS: list = ["*"]


settings = Settings()

