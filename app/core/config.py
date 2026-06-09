from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Ticket Attribution System"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ticket_attr"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    MODEL_STORE_DIR: str = "./models_store"
    DATA_DIR: str = "./data"

    LOW_CONFIDENCE_THRESHOLD: float = 0.70
    BATCH_CONFIRM_CHUNK_SIZE: int = 100

    MODEL_NAME: str = "uer/roberta-base-chinese-extractive-qa"
    MAX_SEQ_LENGTH: int = 256
    TRAIN_BATCH_SIZE: int = 32
    EVAL_BATCH_SIZE: int = 64
    NUM_EPOCHS: int = 10
    LEARNING_RATE: float = 2e-5
    WARMUP_RATIO: float = 0.1

    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
