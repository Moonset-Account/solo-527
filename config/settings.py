from pydantic_settings import BaseSettings
from typing import Dict


class Settings(BaseSettings):
    app_name: str = "内容安全审核积压看板"
    debug: bool = True
    
    timescaledb_url: str = "postgresql://postgres:postgres@localhost:5432/content_safety"
    redis_url: str = "redis://localhost:6379/0"
    
    cache_ttl_backlog: int = 300
    cache_ttl_funnel: int = 600
    cache_ttl_workload: int = 300
    cache_ttl_appeal: int = 1800
    cache_ttl_dimensions: int = 3600
    
    sla_thresholds: Dict[str, int] = {
        "色情": 1800,
        "暴力": 1200,
        "政治": 900,
        "广告": 3600,
        "低俗": 2700,
    }
    
    default_time_range_hours: int = 24
    
    class Config:
        env_file = ".env"


settings = Settings()
