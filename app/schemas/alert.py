from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.task import AlertSeverity, AlertType


class AlertEventInfo(BaseSchema):
    id: int
    alert_type: AlertType
    severity: AlertSeverity

    title: str
    message: str

    task_id: Optional[int] = None
    model_id: Optional[int] = None
    error_sample_id: Optional[int] = None
    triggered_by_id: Optional[int] = None

    related_ids: Optional[List[int]] = None
    metadata: Optional[Dict[str, Any]] = None
    metrics_snapshot: Optional[Dict[str, Any]] = None

    channels_notified: Optional[List[str]] = None
    status: str = "active"
    acknowledged: bool = False
    acknowledged_by_id: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    ack_note: Optional[str] = None

    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[int] = None
    resolution_note: Optional[str] = None

    created_at: datetime
    updated_at: datetime


class AlertListFilter(BaseSchema):
    status: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    alert_type: Optional[AlertType] = None
    acknowledged: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class AcknowledgeRequest(BaseSchema):
    ack_note: Optional[str] = Field(None, max_length=1000)


class ResolveRequest(BaseSchema):
    resolution_note: Optional[str] = Field(None, max_length=2000)


class AlertStatItem(BaseSchema):
    severity: AlertSeverity
    count: int = 0


class AlertStatsResponse(BaseSchema):
    active_count: int = 0
    acknowledged_count: int = 0
    resolved_count: int = 0
    by_severity: List[AlertStatItem] = Field(default_factory=list)
    avg_response_time_seconds: Optional[float] = None
    avg_resolve_time_seconds: Optional[float] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class SyntheticCheckResult(BaseSchema):
    policy_name: str
    triggered: bool = False
    alert_id: Optional[int] = None
    message: Optional[str] = None
    value: Optional[float] = None
    threshold: Optional[float] = None


class SyntheticCheckResponse(BaseSchema):
    check_count: int = 0
    triggered_count: int = 0
    results: List[SyntheticCheckResult] = Field(default_factory=list)
    started_at: datetime
    finished_at: Optional[datetime] = None
