from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    real_name: Optional[str] = None
    student_id: Optional[str] = None
    dorm_room: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "student"


class UserResponse(BaseModel):
    id: int
    username: str
    real_name: Optional[str]
    student_id: Optional[str]
    dorm_room: Optional[str]
    phone: Optional[str]
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


class RepairOrderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    location: Optional[str] = None
    dorm_room: Optional[str] = None
    urgency: Optional[str] = "medium"


class RepairOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    dorm_room: Optional[str] = None
    status: Optional[str] = None
    urgency: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: int
    order_id: int
    file_path: str
    file_name: str
    file_type: Optional[str]
    file_size: Optional[int]
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditRecordResponse(BaseModel):
    id: int
    order_id: int
    reviewer_id: int
    action: str
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OperationHistoryResponse(BaseModel):
    id: int
    order_id: int
    operator_id: int
    field_name: str
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RepairOrderResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    location: Optional[str]
    dorm_room: Optional[str]
    status: str
    urgency: str
    student_id: int
    created_at: datetime
    updated_at: datetime
    attachments: List[AttachmentResponse] = []
    audit_records: List[AuditRecordResponse] = []
    operation_histories: List[OperationHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AuditAction(BaseModel):
    action: str
    comment: Optional[str] = None


class NotificationReceiptResponse(BaseModel):
    id: int
    user_id: int
    order_id: int
    channel: str
    content: Optional[str]
    is_read: bool
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClubActivityResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    organizer: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    location: Optional[str]
    status: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecondHandTradeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price: Optional[float]
    category: Optional[str]
    seller_id: int
    contact: Optional[str]
    status: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SeatViolationResponse(BaseModel):
    id: int
    student_id: int
    seat_number: Optional[str]
    library_room: Optional[str]
    violation_type: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExportRequest(BaseModel):
    export_type: str
    filter_params: Optional[dict] = None


class ExportRecordResponse(BaseModel):
    id: int
    operator_id: int
    export_type: str
    filter_params: Optional[dict]
    file_path: Optional[str]
    generated_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatisticsResponse(BaseModel):
    total_orders: int
    pending_orders: int
    in_progress_orders: int
    completed_orders: int
    avg_processing_days: Optional[float] = None
    category_distribution: Optional[dict] = None
    urgency_distribution: Optional[dict] = None
