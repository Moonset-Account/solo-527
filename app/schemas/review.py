from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.dataset import SampleStatus


class ReviewTaskFilter(BaseSchema):
    assignee_id: Optional[int] = None
    status: Optional[SampleStatus] = None
    dataset_id: Optional[int] = None
    sample_type: Optional[str] = None


class AssignRequest(BaseSchema):
    sample_ids: List[int] = Field(..., min_length=1, description="样本ID列表")
    reviewer_ids: List[int] = Field(..., min_length=1, description="审核员ID列表")
    strategy: str = Field("round_robin", description="分配策略: round_robin, load_balance")


class StartReviewResponse(BaseSchema):
    sample_id: int
    reviewer_id: int
    locked: bool = True
    lock_expires_at: Optional[datetime] = None


class SubmitReviewRequest(BaseSchema):
    status: SampleStatus = Field(..., description="审核结论")
    review_comment: Optional[str] = Field(None, description="审核意见")
    corrected_input_text: Optional[str] = None
    corrected_reference_output: Optional[str] = None
    corrected_metadata: Optional[Dict[str, Any]] = None
    labels: Optional[List[Dict[str, Any]]] = None
    score: Optional[float] = None


class EscalateRequest(BaseSchema):
    reason: str = Field(..., min_length=1, description="升级原因")
    escalate_to_id: Optional[int] = Field(None, description="目标审核员ID")
    priority: str = Field("normal", description="优先级: low, normal, high, urgent")


class ReviewerStat(BaseSchema):
    reviewer_id: int
    reviewer_name: Optional[str] = None
    assigned_count: int = 0
    completed_count: int = 0
    pending_count: int = 0
    reject_count: int = 0
    approval_rate: float = 0.0
    avg_review_seconds: float = 0.0
    conflict_count: int = 0
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class ReviewStatsResponse(BaseSchema):
    total_tasks: int = 0
    completed_tasks: int = 0
    pending_tasks: int = 0
    overall_approval_rate: float = 0.0
    reviewer_stats: List[ReviewerStat] = Field(default_factory=list)
    sample_type_distribution: Optional[Dict[str, int]] = None
