from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/meal_delivery"
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "delivery-photos"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    NOTIFICATION_MAX_RETRIES: int = 3
    NOTIFICATION_RETRY_INTERVAL_SECONDS: int = 300
    COLD_BOX_TEMP_THRESHOLD: float = 8.0

    class Config:
        env_file = ".env"


settings = Settings()
