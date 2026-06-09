from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time


class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    default_no_show_rate: int = 15
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_no_show_rate: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TimeSlotBase(BaseModel):
    department_id: int
    day_of_week: int
    start_time: time
    end_time: time
    capacity: int = 20
    is_active: bool = True


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    capacity: Optional[int] = None
    is_active: Optional[bool] = None


class TimeSlotResponse(TimeSlotBase):
    id: int
    historical_no_show_count: int = 0
    historical_total_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    appointment_no: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    department_id: int
    doctor_name: Optional[str] = None
    appointment_date: date
    appointment_time: time
    appointment_type: str = "普通门诊"
    is_revisit: bool = False
    channel: str = "现场挂号"
    reminder_method: str = "sms"
    days_in_advance: int = 1
    historical_no_show_count: int = 0
    historical_total_count: int = 0
    distance_km: Optional[float] = None
    weather_condition: Optional[str] = None
    is_holiday: bool = False
    actual_status: str = "pending"
    remark: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    actual_status: Optional[str] = None
    remark: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    batch_id: Optional[str] = None
    actual_status_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentImportResponse(BaseModel):
    total_count: int
    success_count: int
    failed_count: int
    batch_id: str
    errors: List[str] = []
