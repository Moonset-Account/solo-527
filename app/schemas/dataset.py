from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.dataset import (
    DatasetType,
    SampleStatus,
    SampleType,
    ErrorSeverity,
    ErrorType,
)


class DatasetBase(BaseSchema):
    name: str = Field(..., max_length=256)
    description: Optional[str] = None
    dataset_type: DatasetType = DatasetType.TRAIN
    version: str = "1.0"
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class DatasetCreate(DatasetBase):
    is_public: bool = False


class DatasetUpdate(BaseSchema):
    name: Optional[str] = Field(None, max_length=256)
    description: Optional[str] = None
    dataset_type: Optional[DatasetType] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class DatasetInfo(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    dataset_type: DatasetType
    version: str
    owner_id: Optional[int] = None
    is_active: bool = True
    is_public: bool = False
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None
    sample_count: int = 0
    approved_count: int = 0
    labeled_count: int = 0
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class SampleBase(BaseSchema):
    sample_type: SampleType = SampleType.CLAUSE_SUMMARY
    input_text: str = Field(..., min_length=1)
    reference_output: Optional[str] = None
    input_metadata: Optional[Dict[str, Any]] = None
    reference_metadata: Optional[Dict[str, Any]] = None
    reference_score: Optional[float] = None
    difficulty_level: int = 1
    source_contract_id: Optional[int] = None
    source_clause_id: Optional[int] = None


class SampleCreate(SampleBase):
    pass


class SampleUpdate(BaseSchema):
    sample_type: Optional[SampleType] = None
    input_text: Optional[str] = None
    reference_output: Optional[str] = None
    input_metadata: Optional[Dict[str, Any]] = None
    reference_metadata: Optional[Dict[str, Any]] = None
    reference_score: Optional[float] = None
    difficulty_level: Optional[int] = None
    status: Optional[SampleStatus] = None
    review_comment: Optional[str] = None


class SampleInfo(BaseSchema):
    id: int
    dataset_id: int
    sample_type: SampleType
    status: SampleStatus

    input_text: str
    reference_output: Optional[str] = None
    input_metadata: Optional[Dict[str, Any]] = None
    reference_metadata: Optional[Dict[str, Any]] = None
    reference_score: Optional[float] = None

    difficulty_level: int = 1
    quality_score: float = 1.0
    weight: float = 1.0

    source_contract_id: Optional[int] = None
    source_clause_id: Optional[int] = None
    source_risk_id: Optional[int] = None

    assignee_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    previous_sample_id: Optional[int] = None
    is_rollback: bool = False
    rollback_reason: Optional[str] = None

    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None


class DatasetVersionCreate(BaseSchema):
    version: str = Field(..., max_length=64)
    change_log: Optional[str] = None


class DatasetVersionInfo(BaseSchema):
    id: int
    dataset_id: int
    version: str
    change_log: Optional[str] = None
    sample_count: int = 0
    stats_snapshot: Optional[Dict[str, Any]] = None
    created_by_id: Optional[int] = None
    created_at: datetime


class DatasetExportRequest(BaseSchema):
    format: str = "jsonl"
    sample_ids: Optional[List[int]] = None
    status_filter: Optional[List[SampleStatus]] = None


class DatasetExportResponse(BaseSchema):
    dataset_id: int
    file_url: str
    sample_count: int
    file_size: int = 0


class DatasetImportResponse(BaseSchema):
    dataset_id: int
    imported_count: int
    skipped_count: int = 0
    errors: List[str] = Field(default_factory=list)


class DatasetCloneRequest(BaseSchema):
    new_name: str
    include_samples: bool = True
    include_versions: bool = False


class SampleRollbackRequest(BaseSchema):
    reason: Optional[str] = None


class ErrorSampleInfo(BaseSchema):
    id: int
    sample_id: Optional[int] = None
    source_task_result_id: Optional[int] = None
    error_type: ErrorType
    severity: ErrorSeverity

    model_output: str
    expected_output: Optional[str] = None
    input_context: Optional[str] = None
    error_description: Optional[str] = None
    reproduction_steps: Optional[str] = None

    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    run_id: Optional[str] = None
    status: str = "open"
    triaged: bool = False
    reproducible: bool = True
    false_alarm: bool = False

    reporter_id: Optional[int] = None
    assignee_id: Optional[int] = None
    fix_suggestion: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[int] = None

    tags: Optional[List[str]] = None
    extra_metadata: Optional[Dict[str, Any]] = None

    created_at: datetime
    updated_at: datetime


class ErrorSampleCreate(BaseSchema):
    sample_id: Optional[int] = None
    source_task_result_id: Optional[int] = None
    error_type: ErrorType = ErrorType.OTHER
    severity: ErrorSeverity = ErrorSeverity.MINOR

    model_output: str
    expected_output: Optional[str] = None
    input_context: Optional[str] = None
    error_description: Optional[str] = None
    reproduction_steps: Optional[str] = None

    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    run_id: Optional[str] = None

    reporter_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reproducible: bool = True

    tags: Optional[List[str]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class ErrorSampleUpdate(BaseSchema):
    status: Optional[str] = None
    severity: Optional[ErrorSeverity] = None
    error_type: Optional[ErrorType] = None
    assignee_id: Optional[int] = None
    triaged: Optional[bool] = None
    reproducible: Optional[bool] = None
    false_alarm: Optional[bool] = None
    fix_suggestion: Optional[str] = None
    resolution_note: Optional[str] = None
    tags: Optional[List[str]] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    model_output: Optional[str] = None
    expected_output: Optional[str] = None
    input_context: Optional[str] = None
    error_description: Optional[str] = None
    reproduction_steps: Optional[str] = None
    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
