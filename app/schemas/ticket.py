from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class _BaseSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)


class TicketChannel(str, Enum):
    WEB = "web"
    APP = "app"
    WECHAT = "wechat"
    PHONE = "phone"
    EMAIL = "email"
    OTHER = "other"


class ProcessResult(str, Enum):
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    TRANSFERRED = "transferred"
    PENDING = "pending"
    CLOSED = "closed"


class RefundStatus(str, Enum):
    NONE = "none"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class TicketStatus(str, Enum):
    NEW = "new"
    AUTO_CLASSIFIED = "auto_classified"
    PENDING_REVIEW = "pending_review"
    HUMAN_REVIEWED = "human_reviewed"
    CONFIRMED = "confirmed"
    ERROR_CASE = "error_case"


class CategoryBase(_BaseSchema):
    name: str = Field(..., max_length=100)
    parent_id: Optional[int] = None
    code: str = Field(..., max_length=50)
    description: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(_BaseSchema):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    children: List["CategoryResponse"] = []


CategoryResponse.model_rebuild()


class TicketBase(_BaseSchema):
    title: str = Field(..., max_length=500)
    content: str
    channel: TicketChannel = TicketChannel.OTHER
    process_result: Optional[ProcessResult] = None
    refund_status: RefundStatus = RefundStatus.NONE
    refund_amount: float = 0.0


class TicketCreate(TicketBase):
    ticket_no: str = Field(..., max_length=50)


class TicketImport(_BaseSchema):
    tickets: List[TicketCreate]


class TicketUpdate(_BaseSchema):
    title: Optional[str] = None
    content: Optional[str] = None
    process_result: Optional[ProcessResult] = None
    refund_status: Optional[RefundStatus] = None
    refund_amount: Optional[float] = None


class PredictResponse(_BaseSchema):
    category_id: int
    category_name: str
    category_code: str
    confidence: float
    top_k: List[Dict[str, Any]] = []
    similar_cases: List[Dict[str, Any]] = []
    is_low_confidence: bool = False
    model_version: str


class TicketPredictResponse(_BaseSchema):
    ticket_id: int
    predictions: PredictResponse


class BatchPredictRequest(_BaseSchema):
    ticket_ids: List[int]
    store_predictions: bool = True


class BatchPredictResponse(_BaseSchema):
    total: int
    success: int
    low_confidence_count: int
    results: List[TicketPredictResponse]
    task_id: Optional[int] = None
    job_id: Optional[str] = None
    status: Optional[str] = None


class AnnotationBase(_BaseSchema):
    ticket_id: int
    category_id: int
    reason: str = Field(..., min_length=5)
    operator_id: int
    operator_name: str = Field(..., max_length=100)
    source: str = "manual"


class AnnotationCreate(AnnotationBase):
    pass


class AnnotationResponse(AnnotationBase):
    id: int
    version: int
    change_log: Optional[Dict[str, Any]] = None
    created_at: datetime
    category: CategoryResponse


class TicketResponse(_BaseSchema):
    id: int
    ticket_no: str
    title: str
    content: str
    channel: str
    process_result: Optional[str] = None
    refund_status: str
    refund_amount: float
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    predicted_category_id: Optional[int] = None
    predicted_category_name: Optional[str] = None
    confidence: Optional[float] = None
    status: str
    model_version_id: Optional[int] = None
    model_version_tag: Optional[str] = None
    is_error_case: bool
    error_source_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    annotations: List[AnnotationResponse] = []
    similar_cases: List[Dict[str, Any]] = []


class TicketListResponse(_BaseSchema):
    items: List[TicketResponse]
    total: int
    page: int
    page_size: int


class BatchConfirmRequest(_BaseSchema):
    ticket_ids: List[int]
    operator_id: int
    operator_name: str = Field(..., max_length=100)
    category_overrides: Optional[Dict[int, int]] = None
    reason: Optional[str] = "批量确认分类结果"


class BatchConfirmResponse(_BaseSchema):
    batch_id: int
    total_count: int
    confirmed_count: int
    error_case_count: int
    stats_updated: bool = False
    created_at: datetime


class ErrorSampleBase(_BaseSchema):
    ticket_id: int
    original_predicted_id: int
    correct_category_id: int
    source: str = "human_review"
    error_type: Optional[str] = None
    reported_by: Optional[str] = None


class ErrorSampleResponse(ErrorSampleBase):
    id: int
    included_in_training: bool
    training_run_id: Optional[int] = None
    model_version_id: Optional[int] = None
    created_at: datetime
    ticket_title: Optional[str] = None


class ErrorSampleListResponse(_BaseSchema):
    items: List[ErrorSampleResponse]
    total: int
    page: int
    page_size: int
    by_source: Dict[str, int] = {}


class InferenceBatchTaskResponse(_BaseSchema):
    id: int
    job_id: Optional[str] = None
    status: str
    total_count: int
    success_count: int
    low_confidence_count: int
    error_count: int
    ticket_ids: List[int]
    store_predictions: bool
    error_message: Optional[str] = None
    result_summary: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class InferenceBatchTaskListResponse(_BaseSchema):
    items: List[InferenceBatchTaskResponse]
    total: int
    page: int
    page_size: int
