from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class FilterParams(BaseModel):
    risk_tags: Optional[List[str]] = None
    queue_types: Optional[List[str]] = None
    reviewers: Optional[List[str]] = None
    shifts: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    time_start: datetime
    time_end: datetime
    granularity: str = "1h"


class BacklogPoint(BaseModel):
    timestamp: datetime
    queue_name: str
    backlog_count: int
    sla_breach_count: int


class FunnelStep(BaseModel):
    step_name: str
    count: int
    avg_duration_seconds: float
    conversion_rate: float


class WorkloadItem(BaseModel):
    reviewer_id: str
    reviewer_name: str
    shift: str
    processed_count: int
    avg_review_seconds: float
    current_backlog: int


class AppealReversalItem(BaseModel):
    original_risk_tag: str
    appeal_total: int
    appeal_success: int
    appeal_failed: int
    reversal_rate: float


class SummaryAlert(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    current_value: float
    threshold: float
    trend: str


class BacklogResponse(BaseModel):
    data: List[BacklogPoint]
    filters_applied: FilterParams


class FunnelResponse(BaseModel):
    data: List[FunnelStep]
    filters_applied: FilterParams


class WorkloadResponse(BaseModel):
    data: List[WorkloadItem]
    filters_applied: FilterParams


class AppealReversalResponse(BaseModel):
    data: List[AppealReversalItem]
    filters_applied: FilterParams


class SummaryResponse(BaseModel):
    alerts: List[SummaryAlert]
    total_backlog: int
    sla_breach_rate: float
    avg_review_seconds: float
    appeal_reversal_rate: float


class DimensionsResponse(BaseModel):
    risk_tags: List[Dict[str, str]]
    queue_types: List[str]
    shifts: List[Dict[str, str]]
    sources: List[str]
    reviewers: List[Dict[str, str]]


class ExportTaskSubmit(BaseModel):
    filters: FilterParams
    export_type: str
    format: str = "xlsx"


class ExportTaskStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    download_url: Optional[str] = None
    error_message: Optional[str] = None
