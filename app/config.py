from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/essay_feedback"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MODEL_DEVICE: str = "cpu"
    ANALYSIS_MODEL_NAME: str = "uer/roberta-base-finetuned-dianping-chinese"
    LOW_CONFIDENCE_THRESHOLD: float = 0.6

    SENSITIVE_MASK_PATTERNS: str = "手机号,身份证,邮箱,家庭住址,姓名"
    MASK_REPLACEMENT: str = "***"

    @property
    def sensitive_patterns(self) -> List[str]:
        return [p.strip() for p in self.SENSITIVE_MASK_PATTERNS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
