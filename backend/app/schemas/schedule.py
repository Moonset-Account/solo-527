from datetime import datetime, date, time
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

from app.models.schedule import ScheduleStatus, ConsumptionStatus, AttendanceStatus


class ScheduleBase(BaseModel):
    class_id: int
    teacher_id: Optional[int] = None
    classroom: Optional[str] = None
    course_date: date
    start_time: time
    end_time: time
    duration_minutes: int = 120
    topic: Optional[str] = None
    content: Optional[str] = None
    status: ScheduleStatus = ScheduleStatus.PLANNED
    is_online: bool = False
    online_url: Optional[str] = None
    max_hours_per_student: int = 2
    remark: Optional[str] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None
    classroom: Optional[str] = None
    course_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    topic: Optional[str] = None
    content: Optional[str] = None
    status: Optional[ScheduleStatus] = None
    is_online: Optional[bool] = None
    online_url: Optional[str] = None
    max_hours_per_student: Optional[int] = None
    remark: Optional[str] = None


class ScheduleResponse(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    schedule_code: str
    assigned_student_count: int = 0
    attended_student_count: int = 0
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ScheduleDetail(ScheduleResponse):
    class_name: Optional[str] = None
    teacher_name: Optional[str] = None
    consumptions_count: int = 0


class ScheduleListResponse(BaseModel):
    total: int
    items: List[ScheduleResponse]


class ScheduleCalendarItem(BaseModel):
    id: int
    schedule_code: str
    class_id: int
    class_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    classroom: Optional[str] = None
    course_date: date
    start_time: time
    end_time: time
    topic: Optional[str] = None
    status: ScheduleStatus
    is_online: bool
    assigned_student_count: int
    attended_student_count: int
    color: Optional[str] = None


class ConsumptionBase(BaseModel):
    schedule_id: int
    student_id: int
    hours_consumed: int = 1
    status: ConsumptionStatus = ConsumptionStatus.PENDING
    attendance: AttendanceStatus = AttendanceStatus.PRESENT
    remark: Optional[str] = None


class ConsumptionCreate(ConsumptionBase):
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None
    consumption_date: Optional[date] = None


class ConsumptionBatchCreate(BaseModel):
    schedule_id: int
    student_ids: List[int]
    hours_consumed: int = 1
    attendance_default: AttendanceStatus = AttendanceStatus.PRESENT


class ConsumptionUpdate(BaseModel):
    hours_consumed: Optional[int] = None
    status: Optional[ConsumptionStatus] = None
    attendance: Optional[AttendanceStatus] = None
    remark: Optional[str] = None
    parent_verified: Optional[bool] = None


class ConsumptionResponse(ConsumptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consumption_code: str
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None
    consumption_date: date
    sign_in_time: Optional[datetime] = None
    sign_out_time: Optional[datetime] = None
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    parent_verified: bool = False
    parent_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ConsumptionDetail(ConsumptionResponse):
    student_name: Optional[str] = None
    student_no: Optional[str] = None
    schedule_topic: Optional[str] = None
    schedule_code: Optional[str] = None
    course_date: Optional[date] = None
    class_name: Optional[str] = None
    confirmed_by_name: Optional[str] = None
    attachments: List[Any] = []
    remarks: List[Any] = []
    history_records: List[Any] = []


class ConsumptionListResponse(BaseModel):
    total: int
    items: List[ConsumptionResponse]


class ConsumptionStats(BaseModel):
    date: date
    total_consumptions: int = 0
    total_hours: int = 0
    present_count: int = 0
    absent_count: int = 0
    leave_count: int = 0


class ScheduleFillRate(BaseModel):
    class_id: int
    class_name: str
    max_students: int
    current_students: int
    fill_rate: float
    schedules_this_month: int
    consumed_hours: int
