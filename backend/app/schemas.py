from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, date, time
from typing import Optional, List, Any
from .models import UserRole, AppointmentStatus, TaskStatus


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    real_name: str = Field(..., min_length=2, max_length=50)
    role: UserRole = UserRole.DISPATCHER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    real_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CounselorBase(BaseModel):
    name: str
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    specialty: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class CounselorCreate(CounselorBase):
    pass


class CounselorUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    specialty: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CounselorResponse(CounselorBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TimeSlotBase(BaseModel):
    start_time: time
    end_time: time
    day_of_week: Optional[int] = None
    is_active: bool = True


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    day_of_week: Optional[int] = None
    is_active: Optional[bool] = None


class TimeSlotResponse(TimeSlotBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    counselor_id: int
    time_slot_id: int
    schedule_date: date
    max_appointments: int = 1
    is_available: bool = True


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    counselor_id: Optional[int] = None
    time_slot_id: Optional[int] = None
    schedule_date: Optional[date] = None
    max_appointments: Optional[int] = None
    is_available: Optional[bool] = None


class ScheduleResponse(ScheduleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    counselor_info: Optional[CounselorResponse] = None
    time_slot_info: Optional[TimeSlotResponse] = None

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    schedule_id: int
    visitor_name: str
    visitor_phone: str
    visitor_gender: Optional[str] = None
    visitor_age: Optional[int] = None
    visit_reason: str
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    visit_reason: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    status: AppointmentStatus
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_operation: Optional[Any] = None
    creator_info: Optional[UserResponse] = None
    schedule_info: Optional[ScheduleResponse] = None

    class Config:
        from_attributes = True


class NoShowListBase(BaseModel):
    visitor_phone: str
    visitor_name: Optional[str] = None
    reason: Optional[str] = None
    no_show_count: int = 1
    is_blocked: bool = True


class NoShowListCreate(NoShowListBase):
    pass


class NoShowListUpdate(BaseModel):
    visitor_name: Optional[str] = None
    reason: Optional[str] = None
    no_show_count: Optional[int] = None
    is_blocked: Optional[bool] = None


class NoShowListResponse(NoShowListBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OperationLogResponse(BaseModel):
    id: int
    operator_id: int
    operation_type: str
    target_type: str
    target_id: Optional[int] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime
    operator_info: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class APITaskResponse(BaseModel):
    id: int
    task_id: str
    task_name: str
    status: TaskStatus
    retry_count: int
    max_retries: int
    error_message: Optional[str] = None
    request_data: Optional[Any] = None
    response_data: Optional[Any] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleUtilizationReport(BaseModel):
    schedule_id: int
    counselor_name: str
    schedule_date: date
    time_slot: str
    max_appointments: int
    booked_count: int
    utilization_rate: float
    status: str


class ConflictReport(BaseModel):
    appointment_id: int
    visitor_name: str
    visitor_phone: str
    counselor_name: str
    schedule_date: date
    time_slot: str
    conflict_reason: str
    conflict_with: Optional[int] = None


class ExportRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    include_utilization: bool = True
    include_conflicts: bool = True
    include_operations: bool = True


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
