from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from decimal import Decimal
from app.models import UserRole, BatchStatus, FlowType, RiskLevel, ReminderStatus, AbnormalStatus


class UserBase(BaseModel):
    username: str = Field(..., max_length=50)
    email: Optional[EmailStr] = None
    full_name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.PURCHASER
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None


class SupplierBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    license_no: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    bank_info: Optional[str] = None
    tax_no: Optional[str] = None
    rating: Optional[int] = 3
    remark: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    license_no: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    bank_info: Optional[str] = None
    tax_no: Optional[str] = None
    rating: Optional[int] = None
    is_active: Optional[bool] = None
    remark: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MedicineBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    generic_name: Optional[str] = None
    specification: str = Field(..., max_length=200)
    dosage_form: Optional[str] = None
    manufacturer: Optional[str] = None
    approval_no: Optional[str] = None
    unit: str = "盒"
    category: Optional[str] = None
    storage_condition: Optional[str] = None
    shelf_life_days: Optional[int] = None
    supplier_id: Optional[int] = None
    safety_stock: int = 50
    max_stock: int = 1000
    reorder_point: int = 100
    remark: Optional[str] = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    specification: Optional[str] = None
    dosage_form: Optional[str] = None
    manufacturer: Optional[str] = None
    approval_no: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    storage_condition: Optional[str] = None
    shelf_life_days: Optional[int] = None
    supplier_id: Optional[int] = None
    safety_stock: Optional[int] = None
    max_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    is_active: Optional[bool] = None
    remark: Optional[str] = None


class MedicineResponse(MedicineBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[SupplierResponse] = None

    model_config = ConfigDict(from_attributes=True)


class WarehouseLocationBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    zone: Optional[str] = None
    area: Optional[str] = None
    row: Optional[str] = None
    column: Optional[str] = None
    level: Optional[str] = None
    temperature_zone: Optional[str] = None
    max_capacity: int = 1000
    remark: Optional[str] = None


class WarehouseLocationCreate(WarehouseLocationBase):
    pass


class WarehouseLocationUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    area: Optional[str] = None
    row: Optional[str] = None
    column: Optional[str] = None
    level: Optional[str] = None
    temperature_zone: Optional[str] = None
    max_capacity: Optional[int] = None
    is_active: Optional[bool] = None
    remark: Optional[str] = None


class WarehouseLocationResponse(WarehouseLocationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BatchBase(BaseModel):
    batch_no: str = Field(..., max_length=100)
    medicine_id: int
    supplier_id: Optional[int] = None
    production_date: date
    expiry_date: date
    quantity: int
    purchase_price: Optional[Decimal] = Field(None, max_digits=12, decimal_places=2)
    selling_price: Optional[Decimal] = Field(None, max_digits=12, decimal_places=2)
    location_id: Optional[int] = None
    inspection_report_no: Optional[str] = None
    purchase_order_no: Optional[str] = None
    certificate_no: Optional[str] = None
    sign_difference: Optional[Decimal] = Field(0, max_digits=12, decimal_places=2)
    sign_difference_remark: Optional[str] = None
    remark: Optional[str] = None


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    supplier_id: Optional[int] = None
    quantity: Optional[int] = None
    received_quantity: Optional[int] = None
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    location_id: Optional[int] = None
    status: Optional[BatchStatus] = None
    inspection_status: Optional[str] = None
    inspection_report_no: Optional[str] = None
    sign_difference: Optional[Decimal] = None
    sign_difference_remark: Optional[str] = None
    remark: Optional[str] = None


class BatchResponse(BatchBase):
    id: int
    status: BatchStatus
    received_quantity: int
    inspection_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    medicine: Optional[MedicineResponse] = None
    creator: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StockResponse(BaseModel):
    id: int
    batch_id: int
    location_id: int
    quantity: int
    locked_quantity: int
    available_quantity: int
    last_move_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    batch: Optional[BatchResponse] = None
    location: Optional[WarehouseLocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


class BatchFlowBase(BaseModel):
    batch_id: int
    flow_type: FlowType
    quantity: int
    reference_no: Optional[str] = None
    from_location_id: Optional[int] = None
    to_location_id: Optional[int] = None
    counterparty: Optional[str] = None
    operation_time: Optional[datetime] = None
    remark: Optional[str] = None


class BatchFlowCreate(BatchFlowBase):
    pass


class BatchFlowResponse(BatchFlowBase):
    id: int
    operator_id: Optional[int] = None
    created_at: datetime
    operator: Optional[UserResponse] = None
    from_location: Optional[WarehouseLocationResponse] = None
    to_location: Optional[WarehouseLocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ExpiryReminderBase(BaseModel):
    batch_id: int
    days_to_expiry: int
    reminder_level: RiskLevel = RiskLevel.MEDIUM
    current_stock: Optional[int] = None
    suggested_action: Optional[str] = None


class ExpiryReminderCreate(ExpiryReminderBase):
    pass


class ExpiryReminderHandle(BaseModel):
    status: ReminderStatus = ReminderStatus.PROCESSED
    handle_remark: str


class ExpiryReminderResponse(BaseModel):
    id: int
    batch_id: int
    days_to_expiry: int
    reminder_level: RiskLevel
    status: ReminderStatus
    current_stock: Optional[int] = None
    suggested_action: Optional[str] = None
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    handle_remark: Optional[str] = None
    handle_duration_minutes: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    batch: Optional[BatchResponse] = None
    handler: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StockRiskResponse(BaseModel):
    id: int
    medicine_id: int
    risk_type: str
    risk_level: RiskLevel
    current_stock: Optional[int] = None
    avg_daily_consumption: Optional[Decimal] = None
    days_of_stock: Optional[Decimal] = None
    description: Optional[str] = None
    status: ReminderStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    medicine: Optional[MedicineResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ReplenishSuggestionResponse(BaseModel):
    id: int
    medicine_id: int
    current_stock: Optional[int] = None
    safety_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    suggested_quantity: Optional[int] = None
    max_stock: Optional[int] = None
    avg_monthly_consumption: Optional[Decimal] = None
    estimated_arrival_days: int = 7
    priority: RiskLevel
    status: str
    purchaser_id: Optional[int] = None
    last_order_date: Optional[date] = None
    suggestion_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    medicine: Optional[MedicineResponse] = None
    purchaser: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AbnormalRecordBase(BaseModel):
    abnormal_type: str
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    description: str
    severity: RiskLevel = RiskLevel.MEDIUM


class AbnormalRecordCreate(AbnormalRecordBase):
    pass


class AbnormalRecordHandle(BaseModel):
    status: AbnormalStatus
    handle_solution: str


class AbnormalRecordResponse(BaseModel):
    id: int
    abnormal_type: str
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    description: str
    status: AbnormalStatus
    severity: RiskLevel
    found_by: Optional[int] = None
    found_at: Optional[datetime] = None
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    handle_duration_minutes: Optional[int] = None
    handle_solution: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    batch: Optional[BatchResponse] = None
    medicine: Optional[MedicineResponse] = None
    founder: Optional[UserResponse] = None
    handler: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DictionaryBase(BaseModel):
    dict_type: str
    dict_code: str
    dict_value: str
    sort_order: int = 0
    parent_id: Optional[int] = None
    remark: Optional[str] = None


class DictionaryCreate(DictionaryBase):
    pass


class DictionaryUpdate(BaseModel):
    dict_value: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    parent_id: Optional[int] = None
    remark: Optional[str] = None


class DictionaryResponse(BaseModel):
    id: int
    dict_type: str
    dict_code: str
    dict_value: str
    sort_order: int
    is_active: bool
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    parent_id: Optional[int] = None
    created_by: Optional[int] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReminderStrategyBase(BaseModel):
    strategy_name: str
    strategy_type: str
    conditions: Dict[str, Any]
    actions: Dict[str, Any]
    priority: int = 0
    remark: Optional[str] = None


class ReminderStrategyCreate(ReminderStrategyBase):
    pass


class ReminderStrategyUpdate(BaseModel):
    strategy_name: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    priority: Optional[int] = None
    remark: Optional[str] = None


class ReminderStrategyResponse(BaseModel):
    id: int
    strategy_name: str
    strategy_type: str
    conditions: Dict[str, Any]
    actions: Dict[str, Any]
    is_active: bool
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    priority: int
    created_by: Optional[int] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReportExportBase(BaseModel):
    report_type: str
    report_name: str
    filters: Optional[Dict[str, Any]] = None


class ReportExportResponse(BaseModel):
    id: int
    report_type: str
    report_name: str
    filters: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    total_records: Optional[int] = None
    status: str
    generated_by: Optional[int] = None
    generated_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SignDifferenceResponse(BaseModel):
    id: int
    batch_id: int
    purchase_order_no: Optional[str] = None
    expected_quantity: Optional[int] = None
    actual_quantity: Optional[int] = None
    difference_quantity: Optional[int] = None
    difference_amount: Optional[Decimal] = None
    difference_reason: Optional[str] = None
    status: str
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    handle_duration_minutes: Optional[int] = None
    handle_solution: Optional[str] = None
    created_at: datetime
    batch: Optional[BatchResponse] = None
    handler: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SignDifferenceHandle(BaseModel):
    status: str
    difference_reason: str
    handle_solution: str


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int


class DashboardStats(BaseModel):
    total_medicines: int
    total_batches: int
    total_stock_value: Decimal
    near_expiry_count: int
    low_stock_count: int
    pending_reminders: int
    pending_risk: int
    abnormal_count: int
