from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

from app.models.models import (
    UserRole, AppointmentStatus, CageStatus, BoardingStatus,
    HealthStatus, PetType, ConfigType
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CUSTOMER


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: UserRole
    is_test_account: bool
    is_active: bool
    store_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class PetBase(BaseModel):
    name: str
    pet_type: PetType = PetType.DOG
    breed: Optional[str] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    notes: Optional[str] = None


class PetCreate(PetBase):
    pass


class PetUpdate(PetBase):
    is_active: Optional[bool] = None


class PetResponse(BaseModel):
    id: int
    name: str
    pet_type: PetType
    breed: Optional[str]
    weight: Optional[float]
    age: Optional[int]
    gender: Optional[str]
    notes: Optional[str]
    owner_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: float
    category: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PackageItemBase(BaseModel):
    service_id: int
    quantity: int = 1


class PackageItemCreate(PackageItemBase):
    pass


class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    valid_days: int = 365


class PackageCreate(PackageBase):
    items: List[PackageItemCreate]


class PackageItemResponse(BaseModel):
    id: int
    service_id: int
    service_name: Optional[str] = None
    quantity: int

    class Config:
        from_attributes = True


class PackageResponse(PackageBase):
    id: int
    is_active: bool
    items: List[PackageItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentServiceCreate(BaseModel):
    service_id: int


class AppointmentPackageCreate(BaseModel):
    package_id: int
    user_package_id: Optional[int] = None


class AppointmentBase(BaseModel):
    pet_id: int
    store_id: int
    appointment_date: date
    start_time: time
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    services: List[AppointmentServiceCreate] = []
    packages: List[AppointmentPackageCreate] = []


class AppointmentServiceResponse(BaseModel):
    id: int
    service_id: int
    service_name: Optional[str] = None
    price_at_time: float

    class Config:
        from_attributes = True


class AppointmentResponse(BaseModel):
    id: int
    customer_id: int
    pet_id: int
    pet_name: Optional[str] = None
    store_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    notes: Optional[str]
    total_price: float
    services: List[AppointmentServiceResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CageBase(BaseModel):
    name: str
    cage_type: Optional[str] = None
    max_weight: Optional[float] = None
    location: Optional[str] = None


class CageCreate(CageBase):
    store_id: int


class CageResponse(CageBase):
    id: int
    store_id: int
    status: CageStatus
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StaffAssign(BaseModel):
    staff_id: int
    role: str = "primary"


class BoardingBase(BaseModel):
    pet_id: int
    cage_id: int
    store_id: int
    check_in_date: date
    check_out_date: date
    daily_rate: float
    notes: Optional[str] = None


class BoardingCreate(BoardingBase):
    pass


class BoardingResponse(BoardingBase):
    id: int
    status: BoardingStatus
    actual_check_in: Optional[datetime]
    actual_check_out: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class HealthRecordBase(BaseModel):
    pet_id: int
    record_date: date
    health_status: HealthStatus = HealthStatus.NORMAL
    abnormal_reason: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None


class HealthRecordCreate(HealthRecordBase):
    appointment_id: Optional[int] = None
    staff_id: Optional[int] = None
    store_id: Optional[int] = None


class HealthRecordResponse(HealthRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SystemConfigBase(BaseModel):
    config_type: ConfigType
    name: str
    description: Optional[str] = None
    config_value: Dict[str, Any]
    conditions: Dict[str, Any] = {}
    priority: int = 0
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigResponse(SystemConfigBase):
    id: int
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RepurchaseAnomalyResponse(BaseModel):
    id: int
    appointment_id: int
    customer_id: int
    anomaly_type: str
    description: Optional[str]
    rule_triggered: Optional[str]
    previous_appointment_id: Optional[int]
    gap_days: Optional[int]
    is_resolved: bool
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class HealthStatsResponse(BaseModel):
    store_id: Optional[int]
    store_name: Optional[str]
    date: Optional[date]
    abnormal_reason: Optional[str]
    total_count: int
    abnormal_count: int
    critical_count: int

    class Config:
        from_attributes = True


class VaccineBase(BaseModel):
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None


class VaccineCreate(VaccineBase):
    pass


class VaccineResponse(VaccineBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PetVaccineBase(BaseModel):
    pet_id: int
    vaccine_id: int
    vaccination_date: date
    next_due_date: Optional[date] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class PetVaccineCreate(PetVaccineBase):
    pass


class PetVaccineResponse(PetVaccineBase):
    id: int
    vaccine_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PetVaccineAllergyBase(BaseModel):
    pet_id: int
    vaccine_name: str
    reaction_type: Optional[str] = None
    severity: Optional[str] = None
    reaction_date: Optional[date] = None
    notes: Optional[str] = None


class PetVaccineAllergyCreate(PetVaccineAllergyBase):
    pass


class PetVaccineAllergyResponse(PetVaccineAllergyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StoreBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    id: int
    manager_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class StaffBase(BaseModel):
    position: Optional[str] = None
    specialties: List[str] = []


class StaffCreate(StaffBase):
    user_id: int
    store_id: int


class StaffResponse(StaffBase):
    id: int
    user_id: int
    store_id: int
    user: Optional[UserResponse] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserPackageResponse(BaseModel):
    id: int
    user_id: int
    package_id: int
    package_name: Optional[str] = None
    purchase_date: datetime
    expiry_date: date
    remaining_uses: int
    created_at: datetime

    class Config:
        from_attributes = True
