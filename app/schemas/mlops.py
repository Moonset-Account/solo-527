from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.ml import ModelStatus, MetricType, TaskType, ABStatus


class ModelRegisterRequest(BaseSchema):
    model_name: str = Field(..., max_length=128)
    version: str = Field(..., max_length=64)
    task_type: Optional[TaskType] = None
    provider: str = "openai"
    base_model: Optional[str] = None
    fine_tuned_on: Optional[str] = None
    prompt_template_version: Optional[str] = None
    system_prompt: Optional[str] = None
    generation_config: Optional[Dict[str, Any]] = None
    rag_config: Optional[Dict[str, Any]] = None
    training_metrics: Optional[Dict[str, float]] = None
    eval_metrics: Optional[Dict[str, float]] = None
    description: Optional[str] = None
    changelog: Optional[str] = None
    tags: Optional[List[str]] = None
    parent_version_id: Optional[int] = None


class ModelInfo(BaseSchema):
    id: int
    model_name: str
    version: str
    task_type: Optional[TaskType] = None
    status: ModelStatus
    is_default: bool = False

    provider: str = "openai"
    base_model: Optional[str] = None
    fine_tuned_on: Optional[str] = None
    prompt_template_version: Optional[str] = None

    training_metrics: Optional[Dict[str, Any]] = None
    eval_metrics: Optional[Dict[str, Any]] = None
    threshold_config: Optional[Dict[str, Any]] = None

    description: Optional[str] = None
    changelog: Optional[str] = None
    tags: Optional[List[str]] = None

    parent_version_id: Optional[int] = None
    rollback_to_version: Optional[str] = None
    rolled_back_at: Optional[datetime] = None

    created_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    published_by_id: Optional[int] = None

    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    published_at: Optional[datetime] = None


class PreflightCheckRequest(BaseSchema):
    checks: Optional[List[str]] = None


class PreflightCheckResult(BaseSchema):
    name: str
    passed: bool
    message: Optional[str] = None
    severity: str = "info"
    details: Optional[Dict[str, Any]] = None


class PreflightResponse(BaseSchema):
    model_id: int
    all_passed: bool
    checks: List[PreflightCheckResult] = Field(default_factory=list)


class ApproveRequest(BaseSchema):
    note: Optional[str] = None


class PublishRequest(BaseSchema):
    set_default: bool = True
    note: Optional[str] = None


class RollbackRequest(BaseSchema):
    target_version_id: Optional[int] = None
    reason: str = Field(..., min_length=1)


class MetricPoint(BaseSchema):
    timestamp: datetime
    value: float
    ci_lower: Optional[float] = None
    ci_upper: Optional[float] = None
    sample_size: Optional[int] = None


class ModelMetricsResponse(BaseSchema):
    model_id: int
    metric_type: MetricType
    window_days: int
    points: List[MetricPoint] = Field(default_factory=list)
    avg: Optional[float] = None
    trend: Optional[str] = None


class ABTestCreateRequest(BaseSchema):
    name: str = Field(..., max_length=256)
    description: Optional[str] = None
    model_a_id: int
    model_b_id: int
    task_type: Optional[TaskType] = None
    dataset_id: Optional[int] = None
    split_ratio: float = 0.5
    target_sample_size: int = 0
    primary_metric: str = "f1"


class ABTestInfo(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    model_a_id: int
    model_b_id: int
    model_a_name: Optional[str] = None
    model_b_name: Optional[str] = None
    task_type: Optional[TaskType] = None
    status: ABStatus

    dataset_id: Optional[int] = None
    split_ratio: float = 0.5
    target_sample_size: int = 0
    actual_sample_size_a: int = 0
    actual_sample_size_b: int = 0

    primary_metric: Optional[str] = None
    winner: Optional[str] = None
    p_value: Optional[float] = None
    is_statistically_significant: bool = False
    results_summary: Optional[Dict[str, Any]] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    created_by_id: Optional[int] = None
    analyzed_by_id: Optional[int] = None

    created_at: datetime
    updated_at: datetime


class ABTestAnalyzeResponse(BaseSchema):
    ab_run_id: int
    analyzed: bool
    primary_metric: str
    a_score: Optional[float] = None
    b_score: Optional[float] = None
    diff: Optional[float] = None
    p_value: Optional[float] = None
    is_significant: bool = False
    confidence_level: Optional[float] = None
    recommended_winner: Optional[str] = None
    per_metric: Optional[Dict[str, Any]] = None


class ABTestStopRequest(BaseSchema):
    winner: Optional[str] = Field(None, description="A或B或空(无胜者)")
    reason: Optional[str] = None


class EvaluationCreateRequest(BaseSchema):
    model_id: int
    dataset_id: int
    task_type: Optional[TaskType] = None
    ab_run_id: Optional[int] = None
    variant_label: Optional[str] = None
    metrics: Optional[List[str]] = None
    judge_model: Optional[str] = None


class EvaluationInfo(BaseSchema):
    id: int
    model_id: int
    model_name: Optional[str] = None
    dataset_id: int
    dataset_name: Optional[str] = None
    ab_run_id: Optional[int] = None
    task_type: Optional[TaskType] = None
    variant_label: Optional[str] = None

    total_samples: int = 0
    processed_samples: int = 0
    error_samples: int = 0
    passed_samples: int = 0

    scores: Optional[Dict[str, float]] = None
    metrics: Optional[Dict[str, Any]] = None

    avg_latency_ms: Optional[float] = None
    total_tokens_input: int = 0
    total_tokens_output: int = 0
    total_cost_usd: float = 0.0

    created_at: datetime
