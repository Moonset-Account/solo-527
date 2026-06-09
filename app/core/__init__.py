from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "CodeQASystem"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./storage/db/code_qa.db"

    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS_FOR_LIMITER: bool = False

    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    LLM_MODEL_NAME: str = "HuggingFaceH4/zephyr-7b-beta"
    EMBEDDING_DIMENSION: int = 384
    HUGGINGFACE_TOKEN: Optional[str] = None

    VECTOR_STORE_TYPE: str = "chroma"
    CHROMA_PERSIST_DIR: str = "./storage/indexes/chroma"
    INDEX_STORAGE_DIR: str = "./storage/indexes/llamaindex"
    TOP_K_RETRIEVAL: int = 8
    SIMILARITY_THRESHOLD: float = 0.65
    CONFIDENCE_THRESHOLD_LOW: float = 0.40
    CONFIDENCE_THRESHOLD_MEDIUM: float = 0.60

    MODEL_REGISTRY_DIR: str = "./storage/models"
    DEFAULT_MODEL_VERSION: str = "v1.0.0"

    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    RATE_LIMIT_PER_DAY: int = 10000

    UPLOAD_DIR: str = "./storage/uploads"
    DATASET_VERSION_DIR: str = "./storage/datasets"
    AUDIT_LOG_DIR: str = "./storage/logs/audit"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
