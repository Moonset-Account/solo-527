from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import (
    UserRole, UserStatus, CourseStatus, ScheduleStatus, AttendanceStatus,
    HomeworkStatus, NotificationType, NotificationStatus, LeadSource,
    LeadStatus, PaymentStatus, DataEnvironment
)


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    phone: Optional[str] = None
    username: str
    role: UserRole
    status: UserStatus
    campus_id: Optional[int] = None
    avatar: Optional[str] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    username: str
    password: str = Field(min_length=6)
    role: UserRole = UserRole.STAFF
    campus_id: Optional[int] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    campus_id: Optional[int] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    remarks: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


class CampusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime


class CampusCreate(BaseModel):
    name: str = Field(max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = None


class CampusUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class ClassroomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    campus_id: int
    capacity: int
    is_active: bool


class ClassroomCreate(BaseModel):
    name: str
    campus_id: int
    capacity: int = 20
    equipment: Optional[Dict[str, Any]] = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    total_hours: int = 0
    default_sessions: int = 0
    default_duration: int = 90
    price: Optional[float] = None
    status: CourseStatus
    created_at: datetime


class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    total_hours: int = 0
    default_sessions: int = 0
    default_duration: int = 90
    price: Optional[float] = None
    syllabus: Optional[List[Dict[str, Any]]] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    total_hours: Optional[int] = None
    default_sessions: Optional[int] = None
    default_duration: Optional[int] = None
    price: Optional[float] = None
    status: Optional[CourseStatus] = None


class CourseClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    course_id: int
    campus_id: int
    max_students: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: CourseStatus


class CourseClassCreate(BaseModel):
    name: str
    course_id: int
    campus_id: int
    max_students: int = 20
    min_students: int = 1
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    gender: Optional[str] = None
    birthday: Optional[date] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime


class StudentCreate(BaseModel):
    name: str
    gender: Optional[str] = None
    birthday: Optional[date] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    parent_ids: Optional[List[int]] = None


class EnrollmentCreate(BaseModel):
    student_id: int
    course_class_id: int
    package_id: Optional[int] = None


class TeacherHourRateCreate(BaseModel):
    teacher_id: int
    effective_from: date
    effective_to: Optional[date] = None
    base_rate: float
    overtime_rate: Optional[float] = None
    remarks: Optional[str] = None


class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_class_id: int
    teacher_id: int
    classroom_id: int
    schedule_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    status: ScheduleStatus
    session_no: Optional[int] = None
    topic: Optional[str] = None
    is_makeup: bool = False
    conflict_notified: bool = False
    conflict_details: Optional[str] = None
    created_at: datetime


class ScheduleConflict(BaseModel):
    type: str
    message: str
    conflicting_schedule: Optional[Dict[str, Any]] = None


class ScheduleCreate(BaseModel):
    course_class_id: int
    teacher_id: int
    classroom_id: int
    schedule_date: date
    start_time: time
    end_time: time
    session_no: Optional[int] = None
    topic: Optional[str] = None
    is_makeup: bool = False
    parent_schedule_id: Optional[int] = None
    check_conflict: bool = True


class ScheduleBulkCreate(BaseModel):
    course_class_id: int
    teacher_id: int
    classroom_id: int
    start_date: date
    end_date: date
    weekdays: List[int] = Field(description="0=Mon, 6=Sun")
    start_time: time
    end_time: time
    check_conflict: bool = True


class AttendanceCreate(BaseModel):
    schedule_id: int
    student_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    schedule_id: int
    student_id: int
    status: AttendanceStatus
    remarks: Optional[str] = None


class HomeworkCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_class_id: int
    schedule_id: Optional[int] = None
    deadline: datetime
    attachments: Optional[List[Dict[str, Any]]] = None
    total_points: int = 100


class HomeworkSubmissionCreate(BaseModel):
    homework_id: int
    student_id: int
    content: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class HomeworkReview(BaseModel):
    score: int
    feedback: str


class NotificationCreate(BaseModel):
    recipient_id: int
    notification_type: NotificationType = NotificationType.NOTICE
    title: str
    content: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    channel: str = "in_app"


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: Optional[str] = None
    student_name: Optional[str] = None
    source: LeadSource
    status: LeadStatus
    campus_id: Optional[int] = None
    assigned_to: Optional[int] = None
    next_follow_up: Optional[datetime] = None
    created_at: datetime


class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    student_name: Optional[str] = None
    student_age: Optional[int] = None
    student_grade: Optional[str] = None
    source: LeadSource = LeadSource.OTHER
    campus_id: Optional[int] = None
    assigned_to: Optional[int] = None
    remarks: Optional[str] = None


class LeadFollowUpCreate(BaseModel):
    lead_id: int
    method: Optional[str] = None
    content: str
    result: Optional[str] = None
    next_action: Optional[datetime] = None


class LeadConvert(BaseModel):
    lead_id: int
    student_id: Optional[int] = None
    enrollment_id: Optional[int] = None


class HourPackageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    course_id: int
    total_hours: int
    bonus_hours: int
    price: float
    valid_days: int
    is_active: bool


class HourPackageCreate(BaseModel):
    name: str
    course_id: int
    total_hours: int
    bonus_hours: int = 0
    price: float
    valid_days: int = 365
    description: Optional[str] = None


class StudentHourPackageCreate(BaseModel):
    student_id: int
    package_id: int
    valid_from: date
    valid_to: date
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    paid_amount: Optional[float] = None


class HourConsumptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_package_id: int
    schedule_id: int
    hours_used: float
    consumption_type: str
    consumed_at: datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime


class ScheduleConsumeHours(BaseModel):
    schedule_id: int
    auto_consume: bool = True


class MonthlyReportData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_month: str
    campus_id: Optional[int] = None
    new_leads: int = 0
    converted_leads: int = 0
    conversion_rate: float = 0
    new_students: int = 0
    total_classes: int = 0
    total_hours_consumed: float = 0
    revenue: float = 0
    teacher_hours: Dict[str, float] = {}
    class_attendance: Dict[str, Any] = {}


TokenResponse.model_rebuild()
