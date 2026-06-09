from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class DashboardSummary(BaseSchema):
    days: int = 7
    total_contracts: int = 0
    new_contracts: int = 0
    contracts_processing: int = 0
    contracts_error: int = 0

    total_clauses: int = 0
    total_risks: int = 0
    high_risks: int = 0
    medium_risks: int = 0
    low_risks: int = 0

    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    avg_task_latency_ms: Optional[float] = None

    total_reviews: int = 0
    pending_reviews: int = 0
    approval_rate: Optional[float] = None

    total_models: int = 0
    production_models: int = 0
    active_ab_tests: int = 0

    active_alerts: int = 0
    critical_alerts: int = 0

    total_cost_usd: float = 0.0
    total_tokens: int = 0

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class FunnelStep(BaseSchema):
    step: str
    count: int = 0
    conversion_rate: Optional[float] = None
    drop_off_rate: Optional[float] = None


class FunnelResponse(BaseSchema):
    steps: List[FunnelStep] = Field(default_factory=list)
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class RiskDistributionItem(BaseSchema):
    risk_type: str
    risk_level: str
    count: int = 0
    percentage: float = 0.0


class RiskDistributionResponse(BaseSchema):
    days: int = 30
    total: int = 0
    by_level: List[RiskDistributionItem] = Field(default_factory=list)
    by_type: List[RiskDistributionItem] = Field(default_factory=list)
    trend: Optional[List[Dict[str, Any]]] = None


class ModelComparisonPoint(BaseSchema):
    model_id: int
    model_name: str
    version: str
    metric: str
    value: float
    sample_size: Optional[int] = None
    ci_lower: Optional[float] = None
    ci_upper: Optional[float] = None


class ModelComparisonResponse(BaseSchema):
    model_ids: List[int] = Field(default_factory=list)
    metric: str = "f1"
    days: int = 30
    comparisons: List[ModelComparisonPoint] = Field(default_factory=list)


class ReviewerLeaderboardItem(BaseSchema):
    reviewer_id: int
    reviewer_name: Optional[str] = None
    completed_count: int = 0
    approved_count: int = 0
    rejected_count: int = 0
    approval_rate: float = 0.0
    avg_review_seconds: float = 0.0
    score: float = 0.0


class ReviewerLeaderboardResponse(BaseSchema):
    days: int = 7
    items: List[ReviewerLeaderboardItem] = Field(default_factory=list)


class ErrorTrendPoint(BaseSchema):
    date: str
    error_type: str
    count: int = 0


class ErrorTrendResponse(BaseSchema):
    days: int = 30
    total: int = 0
    by_type: Dict[str, int] = Field(default_factory=dict)
    trend: List[ErrorTrendPoint] = Field(default_factory=list)


class CostBreakdownItem(BaseSchema):
    dimension: str
    name: str
    cost_usd: float = 0.0
    percentage: float = 0.0
    tokens: int = 0


class CostBreakdownResponse(BaseSchema):
    days: int = 30
    total_cost_usd: float = 0.0
    total_tokens: int = 0
    by_model: List[CostBreakdownItem] = Field(default_factory=list)
    by_task_type: List[CostBreakdownItem] = Field(default_factory=list)
    trend: Optional[List[Dict[str, Any]]] = None
