from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "tenant"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserSimple(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApartmentBase(BaseModel):
    apartment_no: str
    building: Optional[str] = None
    floor: Optional[int] = None
    room_no: Optional[str] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    living_rooms: int = 1
    bathrooms: int = 1
    orientation: Optional[str] = None
    floor_level: Optional[str] = None
    decoration: Optional[str] = None
    monthly_rent: float
    deposit_months: float = 1.0
    status: str = "vacant"
    address: Optional[str] = None
    description: Optional[str] = None
    facilities: Optional[str] = None
    tags: Optional[str] = None


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    building: Optional[str] = None
    floor: Optional[int] = None
    room_no: Optional[str] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    monthly_rent: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None
    facilities: Optional[str] = None
    tags: Optional[str] = None
    remark: Optional[str] = None


class ApartmentRemarkUpdate(BaseModel):
    remark: str


class ApartmentResponse(ApartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    apartment_id: int
    appointment_date: date
    appointment_time: str
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    source_channel: Optional[str] = None
    demand_description: Optional[str] = None
    remark: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentAssign(BaseModel):
    consultant_id: int


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    remark: Optional[str] = None
    cancel_reason: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    status: str
    consultant_id: Optional[int] = None
    tenant_id: Optional[int] = None
    cancel_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FollowUpBase(BaseModel):
    appointment_id: int
    follow_type: Optional[str] = None
    content: str
    next_follow_date: Optional[date] = None


class FollowUpCreate(FollowUpBase):
    pass


class FollowUpResponse(FollowUpBase):
    id: int
    operator_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DepositBase(BaseModel):
    apartment_id: int
    tenant_name: str
    tenant_phone: Optional[str] = None
    id_card: Optional[str] = None
    contract_no: Optional[str] = None
    amount: float
    status: str = "paid"
    pay_date: date
    remark: Optional[str] = None


class DepositCreate(DepositBase):
    pass


class DepositUpdate(BaseModel):
    status: Optional[str] = None
    refund_date: Optional[date] = None
    refund_amount: Optional[float] = None
    remark: Optional[str] = None


class DepositResponse(DepositBase):
    id: int
    refund_date: Optional[date] = None
    refund_amount: float = 0
    created_at: datetime
    updated_at: datetime
    apartment: Optional[ApartmentResponse] = None

    class Config:
        from_attributes = True


class ContractRiskBase(BaseModel):
    apartment_id: Optional[int] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    risk_type: str
    risk_level: str = "medium"
    description: str
    remark: Optional[str] = None


class ContractRiskCreate(ContractRiskBase):
    pass


class ContractRiskHandle(BaseModel):
    handle_result: str
    handle_reason: Optional[str] = None
    status: str = "resolved"


class ContractRiskResponse(ContractRiskBase):
    id: int
    risk_no: Optional[str] = None
    status: str
    created_by_id: Optional[int] = None
    handled_by_id: Optional[int] = None
    handle_result: Optional[str] = None
    handle_reason: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    apartment: Optional[ApartmentResponse] = None
    created_by: Optional[UserSimple] = None
    handled_by: Optional[UserSimple] = None

    class Config:
        from_attributes = True


class DictTypeBase(BaseModel):
    dict_code: str
    dict_name: str
    description: Optional[str] = None


class DictTypeCreate(DictTypeBase):
    pass


class DictTypeResponse(DictTypeBase):
    id: int
    is_system: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class DictItemBase(BaseModel):
    dict_type_id: int
    item_label: str
    item_value: str
    sort_order: int = 0
    is_default: bool = False
    status: str = "active"
    remark: Optional[str] = None


class DictItemCreate(DictItemBase):
    pass


class DictItemResponse(DictItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SystemConfigBase(BaseModel):
    config_key: str
    config_value: Optional[str] = None
    config_name: str
    config_group: Optional[str] = None
    value_type: str = "string"
    remark: Optional[str] = None


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    config_value: Optional[str] = None
    config_name: Optional[str] = None
    remark: Optional[str] = None


class SystemConfigResponse(SystemConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSimple(BaseModel):
    id: int
    username: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class ChangeLogResponse(BaseModel):
    id: int
    table_name: str
    record_id: int
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    operator_id: Optional[int] = None
    change_type: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    operator: Optional[UserSimple] = None

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    apartment_id: Optional[int] = None
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VacancyHistoryResponse(BaseModel):
    id: int
    apartment_id: int
    from_status: Optional[str] = None
    to_status: str
    change_date: date
    days_vacant: int = 0
    remark: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_apartments: int
    vacant_apartments: int
    occupied_apartments: int
    vacancy_rate: float
    today_appointments: int
    pending_appointments: int
    pending_risks: int
    total_deposits: float
