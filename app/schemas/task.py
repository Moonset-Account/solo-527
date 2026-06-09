from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.task import (
    TaskType,
    TaskStatus,
    TaskPriority,
    FeedbackType,
)


class TaskInfo(BaseSchema):
    id: int
    task_type: TaskType
    status: TaskStatus
    priority: TaskPriority

    celery_task_id: Optional[str] = None
    task_queue: Optional[str] = None

    contract_id: Optional[int] = None
    dataset_id: Optional[int] = None
    model_id: Optional[int] = None
    ab_run_id: Optional[int] = None

    creator_id: Optional[int] = None
    assignee_id: Optional[int] = None

    title: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None

    progress_percent: float = 0.0
    progress_message: Optional[str] = None
    progress_detail: Optional[Dict[str, Any]] = None

    retry_count: int = 0
    max_retries: int = 3
    timeout_seconds: int = 3600

    queued_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None

    total_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    error_traceback: Optional[str] = None

    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

    created_at: datetime
    updated_at: datetime


class TaskDetail(TaskInfo):
    results: List["TaskResultInfo"] = Field(default_factory=list)


class TaskResultInfo(BaseSchema):
    id: int
    task_id: int
    result_key: str = "default"
    result_type: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    result_text: Optional[str] = None
    result_file_path: Optional[str] = None

    metrics: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    latency_ms: Optional[float] = None
    tokens_used: int = 0
    cost_usd: float = 0.0

    created_at: datetime


class TaskListFilter(BaseSchema):
    task_type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    creator_id: Optional[int] = None
    assignee_id: Optional[int] = None
    contract_id: Optional[int] = None
    dataset_id: Optional[int] = None
    model_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    keyword: Optional[str] = None


class TaskRetryRequest(BaseSchema):
    force: bool = False
    new_params: Optional[Dict[str, Any]] = None


class TaskProgressEvent(BaseSchema):
    task_id: int
    status: TaskStatus
    progress_percent: float
    progress_message: Optional[str] = None
    progress_detail: Optional[Dict[str, Any]] = None
    timestamp: datetime


class FeedbackInfo(BaseSchema):
    id: int
    user_id: int
    task_result_id: Optional[int] = None
    risk_id: Optional[int] = None
    summary_id: Optional[int] = None

    feedback_type: FeedbackType
    score: Optional[float] = None
    content: Optional[str] = None
    corrected_text: Optional[str] = None

    metadata: Optional[Dict[str, Any]] = None
    resolved: bool = False
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None

    escalated: bool = False
    escalated_to_id: Optional[int] = None
    escalation_note: Optional[str] = None

    created_at: datetime
    updated_at: datetime


TaskDetail.model_rebuild()
