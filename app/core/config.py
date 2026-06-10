from __future__ import annotations

import secrets
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppEnv(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "青禾应收对账台"
    app_env: AppEnv = AppEnv.DEVELOPMENT
    debug: bool = True
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    api_v1_prefix: str = "/api"

    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    workers: int = 1

    postgres_server: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "qinghe_receivable"
    database_url: Optional[str] = None

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str = ""
    redis_url: Optional[str] = None

    session_cookie_name: str = "qh_session"
    session_ttl_seconds: int = 86400
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    jwt_algorithm: str = "HS256"

    upload_dir: str = "./uploads"
    export_dir: str = "./exports"
    max_upload_size_mb: int = 20

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@qinghe.local"
    smtp_use_tls: bool = True

    init_admin_email: str = "admin@qinghe.local"
    init_admin_password: str = "admin123456"
    init_admin_name: str = "系统管理员"

    base_dir: Path = Path(__file__).resolve().parents[2]
    templates_dir: Path = base_dir / "app" / "templates"
    static_dir: Path = base_dir / "app" / "static"

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str], info) -> str:
        if isinstance(v, str) and v:
            return v
        data = info.data
        user = data.get("postgres_user", "postgres")
        password = data.get("postgres_password", "postgres")
        server = data.get("postgres_server", "localhost")
        port = data.get("postgres_port", 5432)
        db = data.get("postgres_db", "qinghe_receivable")
        return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"

    @field_validator("redis_url", mode="before")
    @classmethod
    def assemble_redis_url(cls, v: Optional[str], info) -> str:
        if isinstance(v, str) and v:
            return v
        data = info.data
        host = data.get("redis_host", "localhost")
        port = data.get("redis_port", 6379)
        db = data.get("redis_db", 0)
        password = data.get("redis_password", "")
        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    @property
    def upload_path(self) -> Path:
        p = self.base_dir / self.upload_dir
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def export_path(self) -> Path:
        p = self.base_dir / self.export_dir
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == AppEnv.PRODUCTION


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
