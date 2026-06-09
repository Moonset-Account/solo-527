from functools import lru_cache
from typing import List, Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


def _parse_csv_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(v).strip().lower() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [p.strip().lower() for p in value.split(",") if p.strip()]
    if value is None:
        return []
    return [str(value)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "ContractRiskAI"
    APP_ENV: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    API_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./contract_risk_ai.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL_NAME: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    LOCAL_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    USE_LOCAL_LLM: bool = False
    LOCAL_LLM_BASE_URL: Optional[str] = None
    LOCAL_LLM_MODEL_NAME: str = "qwen2.5:7b"

    VECTOR_STORE_PATH: str = "./data/vector_store"
    UPLOAD_DIR: str = "./data/uploads"
    DATASET_DIR: str = "./data/datasets"
    EXPORT_DIR: str = "./data/exports"
    LOG_DIR: str = "./logs"

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    ALERT_WEBHOOK_URL: Optional[str] = None
    ALERT_EMAIL: Optional[str] = None
    ALERT_EMAIL_CONFIG_JSON: Optional[str] = None
    ALERT_THRESHOLD_ERROR_RATE: float = 0.1
    ALERT_THRESHOLD_LATENCY: float = 30.0

    def get_alert_email_config(self) -> Optional[dict]:
        import json
        if self.ALERT_EMAIL_CONFIG_JSON:
            try:
                return json.loads(self.ALERT_EMAIL_CONFIG_JSON)
            except Exception:
                pass
        return None

    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    SUPPORTED_EXTENSIONS: str = ".pdf,.docx,.txt"

    @field_validator("SUPPORTED_EXTENSIONS", mode="after")
    @classmethod
    def _split_extensions(cls, v: Any) -> List[str]:
        return _parse_csv_list(v)

    def get_supported_extensions_list(self) -> List[str]:
        return _parse_csv_list(self.SUPPORTED_EXTENSIONS)

    SUMMARY_MAX_LENGTH: int = 500
    SUMMARY_MIN_LENGTH: int = 100
    RISK_THRESHOLD_HIGH: float = 0.7
    RISK_THRESHOLD_MEDIUM: float = 0.4
    RISK_THRESHOLD_LOW: float = 0.2

    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K_RETRIEVE: int = 5
    TOP_K_RERANK: int = 3

    DEFAULT_MODEL_VERSION: str = "v1.0.0"
    ENABLE_AB_TESTING: bool = False
    AB_TEST_SPLIT: float = 0.5

    BATCH_SIZE_PROCESS: int = 20
    MAX_RETRY_ATTEMPTS: int = 3
    RETRY_DELAY_SECONDS: int = 2


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    import os
    for dir_name in [
        settings.VECTOR_STORE_PATH,
        settings.UPLOAD_DIR,
        settings.DATASET_DIR,
        settings.EXPORT_DIR,
        settings.LOG_DIR,
    ]:
        os.makedirs(dir_name, exist_ok=True)
    return settings


settings = get_settings()
