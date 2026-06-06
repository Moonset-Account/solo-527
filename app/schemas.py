from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from app.models import UserRole, RegistrationStatus, ScheduleStatus, MedicineBoxStatus, TaskStatus


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.VOLUNTEER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


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


class DoctorBase(BaseModel):
    license_number: str
    specialty: str
    title: Optional[str] = None
    hospital: Optional[str] = None
    biography: Optional[str] = None
    is_available: bool = True


class DoctorCreate(DoctorBase):
    user_id: int


class DoctorUpdate(BaseModel):
    specialty: Optional[str] = None
    title: Optional[str] = None
    hospital: Optional[str] = None
    biography: Optional[str] = None
    is_available: Optional[bool] = None


class DoctorResponse(DoctorBase):
    id: int
    user_id: int
    user: UserResponse
    created_at: datetime

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    name: str
    address: str
    district: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    capacity: Optional[int] = None
    facilities: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    capacity: Optional[int] = None
    facilities: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VolunteerBase(BaseModel):
    id_card: Optional[str] = None
    skills: Optional[List[str]] = None
    organization: Optional[str] = None
    is_available: bool = True


class VolunteerCreate(VolunteerBase):
    user_id: int


class VolunteerUpdate(BaseModel):
    skills: Optional[List[str]] = None
    organization: Optional[str] = None
    is_available: Optional[bool] = None


class VolunteerResponse(VolunteerBase):
    id: int
    user_id: int
    user: UserResponse
    total_service_hours: float
    created_at: datetime

    class Config:
        from_attributes = True


class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: str
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    stock_quantity: int = 0
    minimum_stock: int = 10
    storage_condition: Optional[str] = None
    notes: Optional[str] = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    stock_quantity: Optional[int] = None
    minimum_stock: Optional[int] = None
    storage_condition: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class MedicineResponse(MedicineBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MedicineBoxItemBase(BaseModel):
    medicine_id: int
    packed_quantity: int


class MedicineBoxItemCreate(MedicineBoxItemBase):
    pass


class MedicineBoxItemUpdate(BaseModel):
    packed_quantity: Optional[int] = None
    used_quantity: Optional[int] = None
    returned_quantity: Optional[int] = None


class MedicineBoxItemResponse(MedicineBoxItemBase):
    id: int
    box_id: int
    medicine: MedicineResponse
    used_quantity: int
    returned_quantity: int

    class Config:
        from_attributes = True


class MedicineBoxBase(BaseModel):
    box_code: str
    name: Optional[str] = None
    current_location: Optional[str] = None
    notes: Optional[str] = None


class MedicineBoxCreate(MedicineBoxBase):
    items: List[MedicineBoxItemCreate] = []


class MedicineBoxUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[MedicineBoxStatus] = None
    current_location: Optional[str] = None
    notes: Optional[str] = None


class MedicineBoxResponse(MedicineBoxBase):
    id: int
    status: MedicineBoxStatus
    schedule_id: Optional[int] = None
    items: List[MedicineBoxItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScheduleVolunteerBase(BaseModel):
    volunteer_id: int
    role: Optional[str] = None


class ScheduleVolunteerCreate(ScheduleVolunteerBase):
    pass


class ScheduleVolunteerResponse(ScheduleVolunteerBase):
    id: int
    schedule_id: int
    volunteer: VolunteerResponse
    assigned_at: datetime
    checked_in: bool
    checked_in_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    doctor_id: int
    location_id: int
    date: date
    start_time: str
    end_time: str
    max_patients: int = 30


class ScheduleCreate(ScheduleBase):
    volunteer_ids: List[int] = []


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    doctor_id: Optional[int] = None
    location_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    max_patients: Optional[int] = None
    status: Optional[ScheduleStatus] = None


class ScheduleResponse(ScheduleBase):
    id: int
    status: ScheduleStatus
    doctor: DoctorResponse
    location: LocationResponse
    volunteers: List[ScheduleVolunteerResponse] = []
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationBase(BaseModel):
    schedule_id: int
    location_id: int
    patient_name: str
    patient_gender: Optional[str] = None
    patient_age: Optional[int] = None
    patient_id_card: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_address: Optional[str] = None
    chief_complaint: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationReview(BaseModel):
    is_eligible: bool
    eligibility_reason: Optional[str] = None


class RegistrationUpdate(BaseModel):
    status: Optional[RegistrationStatus] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    chief_complaint: Optional[str] = None


class RegistrationResponse(RegistrationBase):
    id: int
    registration_number: str
    status: RegistrationStatus
    queue_number: Optional[int] = None
    is_eligible: Optional[bool] = None
    eligibility_reason: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckInBase(BaseModel):
    schedule_id: int
    registration_id: int
    notes: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckInResponse(CheckInBase):
    id: int
    check_in_time: datetime
    checked_in_by: Optional[int] = None

    class Config:
        from_attributes = True


class PrescriptionItemBase(BaseModel):
    medicine_id: int
    quantity: int


class PrescriptionItemCreate(PrescriptionItemBase):
    pass


class PrescriptionItemResponse(PrescriptionItemBase):
    id: int
    service_record_id: int
    medicine: MedicineResponse

    class Config:
        from_attributes = True


class ServiceRecordBase(BaseModel):
    schedule_id: int
    registration_id: int
    doctor_id: int
    diagnosis: Optional[str] = None
    treatment_notes: Optional[str] = None
    referral_suggested: bool = False
    referral_reason: Optional[str] = None


class ServiceRecordCreate(ServiceRecordBase):
    prescriptions: List[PrescriptionItemCreate] = []


class ServiceRecordResponse(ServiceRecordBase):
    id: int
    service_start_time: Optional[datetime] = None
    service_end_time: Optional[datetime] = None
    prescriptions: List[PrescriptionItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ReturnedItemBase(BaseModel):
    box_id: int
    medicine_id: int
    returned_quantity: int
    condition_notes: Optional[str] = None


class ReturnedItemCreate(ReturnedItemBase):
    pass


class ReturnedItemResponse(ReturnedItemBase):
    id: int
    returned_by: Optional[int] = None
    returned_at: datetime
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MonthlyReconciliationBase(BaseModel):
    month: str
    notes: Optional[str] = None


class MonthlyReconciliationResponse(MonthlyReconciliationBase):
    id: int
    total_schedules: int
    total_patients: int
    total_medicines_used: int
    total_medicines_returned: int
    total_service_hours: float
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    recipient_id: int
    title: str
    content: str
    notification_type: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    sender_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ImportExportTaskResponse(BaseModel):
    id: int
    task_type: str
    entity_type: str
    file_name: Optional[str] = None
    status: TaskStatus
    total_count: int
    success_count: int
    failed_count: int
    error_message: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ServiceStatsResponse(BaseModel):
    total_schedules: int = 0
    total_patients: int = 0
    total_doctors: int = 0
    total_volunteers: int = 0
    total_medicines_used: int = 0
    total_service_hours: float = 0.0
    schedules_by_month: Dict[str, int] = {}
    patients_by_location: Dict[str, int] = {}


class ErrorLogResponse(BaseModel):
    id: int
    error_type: Optional[str] = None
    error_message: str
    stack_trace: Optional[str] = None
    endpoint: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
