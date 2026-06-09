from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import ModelStatus, FeedbackType


class ModelVersionBase(BaseModel):
    version_tag: str = Field(..., min_length=1, max_length=64)
    model_name: str = Field(..., max_length=255)
    embedding_model: Optional[str] = None
    llm_model: Optional[str] = None
    description: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    training_config: Optional[Dict[str, Any]] = None
    is_default: bool = False


class ModelVersionCreate(ModelVersionBase):
    dataset_version_id: Optional[int] = None


class ModelVersionOut(ModelVersionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ModelStatus
    storage_path: Optional[str] = None
    dataset_version_id: Optional[int] = None
    created_by: Optional[str] = None
    created_at: datetime
    deployed_at: Optional[datetime] = None


class ModelMetrics(BaseModel):
    total_qa_calls: int = 0
    avg_confidence: Optional[float] = None
    low_confidence_rate: float = 0.0
    avg_latency_ms: Optional[float] = None
    positive_feedback_rate: float = 0.0
    negative_feedback_rate: float = 0.0
    error_rate: float = 0.0
    period_start: datetime
    period_end: datetime


class ModelDashboardData(BaseModel):
    model_version: str
    metrics: ModelMetrics
    top_error_categories: List[Dict[str, Any]] = Field(default_factory=list)
    recent_feedbacks: List[Dict[str, Any]] = Field(default_factory=list)
