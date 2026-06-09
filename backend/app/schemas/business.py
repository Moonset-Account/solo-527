from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SmsTemplateBase(BaseModel):
    name: str
    code: str
    content: str
    risk_level_min: str = "medium"
    is_active: bool = True


class SmsTemplateCreate(SmsTemplateBase):
    pass


class SmsTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    risk_level_min: Optional[str] = None
    is_active: Optional[bool] = None


class SmsTemplateResponse(SmsTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SmsRecordResponse(BaseModel):
    id: int
    risk_score_id: int
    template_id: int
    send_status: str
    send_time: Optional[datetime] = None
    delivered: Optional[bool] = None
    delivery_time: Optional[datetime] = None
    failure_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SmsSendRequest(BaseModel):
    risk_score_ids: List[int]
    template_id: Optional[int] = None


class SmsSendResponse(BaseModel):
    total_count: int
    success_count: int
    failed_count: int


class CallbackRecordBase(BaseModel):
    risk_score_id: int
    assigned_to: Optional[int] = None
    priority: str = "high"
    callback_status: str = "pending"


class CallbackCreate(CallbackRecordBase):
    pass


class CallbackUpdate(BaseModel):
    callback_status: Optional[str] = None
    callback_result: Optional[str] = None
    patient_response: Optional[str] = None
    notes: Optional[str] = None
    callback_time: Optional[datetime] = None
    assigned_to: Optional[int] = None


class CallbackResponse(CallbackRecordBase):
    id: int
    callback_result: Optional[str] = None
    patient_response: Optional[str] = None
    notes: Optional[str] = None
    callback_time: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CallbackListGenerateRequest(BaseModel):
    min_risk_level: str = "high"
    max_count: int = 100
    department_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class ManualFeedbackBase(BaseModel):
    appointment_id: int
    feedback_type: str = "relabel"
    original_risk_level: Optional[str] = None
    corrected_risk_level: Optional[str] = None
    original_score: Optional[float] = None
    corrected_score: Optional[float] = None
    reason: Optional[str] = None
    remark: Optional[str] = None
    is_error_sample: bool = False
    error_type: Optional[str] = None
    risk_score_id: Optional[int] = None


class ManualFeedbackCreate(ManualFeedbackBase):
    pass


class ManualFeedbackUpdate(BaseModel):
    review_status: Optional[str] = None
    review_comment: Optional[str] = None


class ManualFeedbackResponse(ManualFeedbackBase):
    id: int
    operator_id: int
    reviewer_id: Optional[int] = None
    batch_id: Optional[str] = None
    review_status: str = "pending"
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BatchFeedbackRequest(BaseModel):
    feedbacks: List[ManualFeedbackCreate]
    batch_id: Optional[str] = None


class BatchFeedbackResponse(BaseModel):
    total_count: int
    success_count: int
    failed_count: int
    batch_id: str


class DashboardKpiResponse(BaseModel):
    total_appointments: int
    total_scored: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    actual_no_show_count: int
    predicted_no_show_count: int
    precision_rate: Optional[float] = None
    recall_rate: Optional[float] = None
    sms_sent_count: int
    callbacks_completed: int
    callbacks_pending: int


class TrendDataPoint(BaseModel):
    date: str
    value: float
    label: Optional[str] = None


class DashboardResponse(BaseModel):
    kpis: DashboardKpiResponse
    risk_trend: List[TrendDataPoint]
    department_distribution: List[Dict[str, Any]]
    risk_level_distribution: List[Dict[str, Any]]
    top_error_samples: List[Dict[str, Any]]
    model_metrics_history: List[Dict[str, Any]]
