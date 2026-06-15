from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, Field


class DoctorBase(BaseModel):
    name: str
    title: Optional[str] = None
    department: Optional[str] = "口腔科"
    phone: Optional[str] = None
    is_active: Optional[bool] = True


class DoctorCreate(DoctorBase):
    pass


class Doctor(DoctorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TimeSlotBase(BaseModel):
    start_time: time
    end_time: time
    is_booked: Optional[bool] = False
    is_locked: Optional[bool] = False


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlot(TimeSlotBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    doctor_id: int
    schedule_date: date
    start_time: time
    end_time: time
    total_slots: int = 5
    status: Optional[str] = "active"


class ScheduleCreate(ScheduleBase):
    pass


class Schedule(ScheduleBase):
    id: int
    booked_slots: int = 0
    doctor: Optional[Doctor] = None
    time_slots: List[TimeSlot] = []
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    patient_name: str
    patient_phone: str
    doctor_id: int
    schedule_id: int
    time_slot_id: int
    source: Optional[str] = "direct"
    service_type: Optional[str] = "洁牙"
    price: Optional[float] = 0
    remark: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class Appointment(AppointmentBase):
    id: int
    appointment_no: str
    status: str
    doctor: Optional[Doctor] = None
    schedule: Optional[Schedule] = None
    time_slot: Optional[TimeSlot] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CheckInBase(BaseModel):
    appointment_id: int
    is_no_show: Optional[bool] = False
    operator: Optional[str] = None
    remark: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckIn(CheckInBase):
    id: int
    checkin_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WaitlistBase(BaseModel):
    patient_name: str
    patient_phone: str
    doctor_id: int
    target_date: date
    source: Optional[str] = "direct"
    priority: Optional[int] = 0
    remark: Optional[str] = None


class WaitlistCreate(WaitlistBase):
    pass


class Waitlist(WaitlistBase):
    id: int
    status: str
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RefundBase(BaseModel):
    appointment_id: int
    amount: float
    reason: Optional[str] = None
    operator: Optional[str] = None


class RefundCreate(RefundBase):
    pass


class Refund(RefundBase):
    id: int
    refund_no: str
    status: str
    processed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PricingRuleBase(BaseModel):
    name: str
    service_type: str
    base_price: float
    discount: Optional[float] = 0
    source: Optional[str] = "all"
    is_active: Optional[bool] = True
    description: Optional[str] = None
    operator: Optional[str] = None


class PricingRuleCreate(PricingRuleBase):
    pass


class PricingRule(PricingRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemConfigBase(BaseModel):
    config_key: str
    config_value: Optional[str] = None
    config_type: Optional[str] = "string"
    description: Optional[str] = None


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    config_value: str
    operator: Optional[str] = None


class SystemConfig(SystemConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConfigChangeLogBase(BaseModel):
    config_key: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    operator: Optional[str] = None
    change_type: Optional[str] = "update"


class ConfigChangeLog(ConfigChangeLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TechnicianLeaveBase(BaseModel):
    doctor_id: int
    leave_date: date
    leave_type: Optional[str] = "年假"
    reason: Optional[str] = None
    operator: Optional[str] = None


class TechnicianLeaveCreate(TechnicianLeaveBase):
    pass


class TechnicianLeave(TechnicianLeaveBase):
    id: int
    status: str
    created_at: datetime
    doctor: Optional["Doctor"] = None

    class Config:
        from_attributes = True


class ProcessLogBase(BaseModel):
    appointment_id: int
    action: str
    operator: Optional[str] = None
    detail: Optional[str] = None


class ProcessLog(ProcessLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
