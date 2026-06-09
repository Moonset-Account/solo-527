from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class _BaseSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)


class ModelStatus(str, Enum):
    DRAFT = "draft"
    TRAINING = "training"
    EVALUATING = "evaluating"
    DEPLOYED = "deployed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TrainingTaskBase(_BaseSchema):
    name: str = Field(..., max_length=200)
    config: Optional[Dict[str, Any]] = None
    include_error_samples: bool = True
    error_source_filter: Optional[List[str]] = None
    dataset_info: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None


class TrainingTaskCreate(TrainingTaskBase):
    pass


class TrainingMetricResponse(_BaseSchema):
    id: int
    epoch: int
    split: str
    loss: Optional[float] = None
    accuracy: Optional[float] = None
    precision_macro: Optional[float] = None
    recall_macro: Optional[float] = None
    f1_macro: Optional[float] = None
    confusion_matrix: Optional[Dict[str, Any]] = None
    per_class_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime


class TrainingTaskResponse(TrainingTaskBase):
    id: int
    job_id: Optional[str] = None
    status: TaskStatus
    progress: float
    status_message: Optional[str] = None
    error_sample_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    metrics: List[TrainingMetricResponse] = []


class TrainingTaskListResponse(_BaseSchema):
    items: List[TrainingTaskResponse]
    total: int
    page: int
    page_size: int


class ModelVersionBase(_BaseSchema):
    version_tag: str = Field(..., max_length=50)
    description: Optional[str] = None
    created_by: Optional[str] = None


class ModelVersionCreate(ModelVersionBase):
    model_path: str
    training_task_id: Optional[int] = None
    previous_version_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    training_data_summary: Optional[Dict[str, Any]] = None


class ModelVersionResponse(ModelVersionBase):
    id: int
    model_path: str
    status: ModelStatus
    metrics: Optional[Dict[str, Any]] = None
    training_task_id: Optional[int] = None
    previous_version_id: Optional[int] = None
    is_current: bool
    training_data_summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    deployed_at: Optional[datetime] = None
    rolled_back_at: Optional[datetime] = None


class DeployModelRequest(_BaseSchema):
    model_version_id: int
    operator_id: int
    operator_name: str = Field(..., max_length=100)


class RollbackRequest(_BaseSchema):
    target_version_id: int
    reason: str = Field(..., min_length=10)
    operator_id: int
    operator_name: str = Field(..., max_length=100)
    rollback_tickets: bool = False


class RollbackResponse(_BaseSchema):
    log_id: int
    from_version_id: int
    from_version_tag: str
    to_version_id: int
    to_version_tag: str
    rollback_type: str
    affected_ticket_count: int
    created_at: datetime


class RollbackLogResponse(_BaseSchema):
    id: int
    from_version_id: int
    from_version_tag: str
    to_version_id: int
    to_version_tag: str
    reason: str
    operator_id: int
    operator_name: str
    rollback_type: str
    affected_ticket_count: int
    created_at: datetime


class EvaluationSummaryResponse(_BaseSchema):
    model_version_id: int
    model_version_tag: str
    total_samples: int
    overall_accuracy: float
    overall_precision: float
    overall_recall: float
    overall_f1: float
    low_confidence_ratio: float
    per_class_metrics: List[Dict[str, Any]] = []
    confusion_matrix: Dict[str, Any] = {}
    generated_at: datetime


class DashboardStatsResponse(_BaseSchema):
    total_tickets: int = 0
    auto_classified: int = 0
    human_review_pending: int = 0
    human_reviewed: int = 0
    confirmed: int = 0
    error_cases: int = 0
    low_confidence_count: int = 0
    average_confidence: float = 0.0
    auto_accuracy: Optional[float] = None
    by_channel: Dict[str, int] = {}
    by_category: Dict[str, int] = {}
    by_date: List[Dict[str, Any]] = []
    current_model_tag: Optional[str] = None
    active_training_tasks: int = 0
