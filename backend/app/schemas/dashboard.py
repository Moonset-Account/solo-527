from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

from app.models.reminder import ReminderType, ReminderStatus, ReminderPriority, ReportType
from app.models.student import ArtMajor


class DashboardStats(BaseModel):
    today_schedules: int = 0
    today_consumptions: int = 0
    today_hours: int = 0
    pending_todos: int = 0
    overdue_reminders: int = 0
    recent_submissions: int = 0
    homework_unsubmitted: int = 0
    pending_receipts: int = 0
    total_students: int = 0
    active_students: int = 0
    total_classes: int = 0
    average_fill_rate: float = 0.0


class TodoItem(BaseModel):
    id: Optional[int] = None
    type: str
    title: str
    description: Optional[str] = None
    priority: str = "normal"
    deadline: Optional[datetime] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: Optional[datetime] = None


class OverdueItem(BaseModel):
    id: Optional[int] = None
    type: str
    title: str
    overdue_time: datetime
    description: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    student_name: Optional[str] = None
    teacher_name: Optional[str] = None


class RecentSubmission(BaseModel):
    id: int
    type: str
    title: str
    student_name: str
    student_id: int
    submit_time: datetime
    status: str
    score: Optional[int] = None
    class_name: Optional[str] = None


class ReminderBase(BaseModel):
    type: ReminderType = ReminderType.OTHER
    priority: ReminderPriority = ReminderPriority.NORMAL
    title: str
    content: str
    user_id: int
    student_id: Optional[int] = None
    class_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    channels: Optional[List[str]] = None
    related_data: Optional[Dict[str, Any]] = None


class ReminderCreate(ReminderBase):
    pass


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: ReminderType
    priority: ReminderPriority
    status: ReminderStatus
    title: str
    content: str
    user_id: int
    student_id: Optional[int] = None
    class_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    is_overdue: bool = False
    created_at: datetime


class ReminderListResponse(BaseModel):
    total: int
    items: List[ReminderResponse]


class ReportBase(BaseModel):
    type: ReportType = ReportType.MONTHLY
    title: str
    campus_id: Optional[int] = None
    period_start: datetime
    period_end: datetime
    summary: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_code: str
    type: ReportType
    title: str
    campus_id: Optional[int] = None
    period_start: datetime
    period_end: datetime
    total_classes: int = 0
    total_schedules: int = 0
    total_consumptions: int = 0
    total_hours_consumed: int = 0
    average_fill_rate: float = 0.0
    class_fill_rates: Optional[List[Any]] = None
    total_students: int = 0
    active_students: int = 0
    homework_completion_rate: float = 0.0
    total_feedbacks: int = 0
    total_notifications: int = 0
    receipt_rate: float = 0.0
    file_path: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime


class ClassFillRateDetail(BaseModel):
    class_id: int
    class_name: str
    major: Optional[str] = None
    max_students: int
    current_students: int
    fill_rate: float
    schedules_count: int = 0
    consumed_hours: int = 0


class MonthlyFillRateReport(BaseModel):
    month: str
    campus_id: Optional[int] = None
    campus_name: Optional[str] = None
    overall_fill_rate: float
    total_classes: int
    total_students: int
    class_details: List[ClassFillRateDetail]
    generated_at: datetime
