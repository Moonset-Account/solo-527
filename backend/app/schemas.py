from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from app.models import (
    UserRole, BatchStatus, LossType, InventoryStatus,
    InspectionStatus, RectificationStatus, CashFlowType, ModuleType
)


class UserBase(BaseModel):
    username: str = Field(..., max_length=50)
    full_name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.BAKER
    store_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    store_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    username: Optional[str] = None


class StoreBase(BaseModel):
    name: str = Field(..., max_length=100)
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[int] = None


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None


class Store(StoreBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str = "个"
    standard_cost: float = 0.0
    selling_price: float = 0.0
    recipe: Optional[Dict[str, Any]] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    standard_cost: Optional[float] = None
    selling_price: Optional[float] = None
    recipe: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class Product(ProductBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class IngredientBase(BaseModel):
    name: str = Field(..., max_length=100)
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str = "kg"
    unit_price: float = 0.0
    min_stock: float = 10.0


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    min_stock: Optional[float] = None
    is_active: Optional[bool] = None


class Ingredient(IngredientBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BakingBatchBase(BaseModel):
    store_id: int
    product_id: int
    baker_id: Optional[int] = None
    planned_quantity: float
    start_time: Optional[datetime] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    baking_time: Optional[int] = None
    remark: Optional[str] = None


class BakingBatchCreate(BakingBatchBase):
    pass


class BakingBatchUpdate(BaseModel):
    product_id: Optional[int] = None
    baker_id: Optional[int] = None
    planned_quantity: Optional[float] = None
    actual_quantity: Optional[float] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BatchStatus] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    baking_time: Optional[int] = None
    remark: Optional[str] = None


class BakingBatch(BakingBatchBase):
    id: int
    batch_no: str
    actual_quantity: Optional[float] = None
    end_time: Optional[datetime] = None
    status: BatchStatus
    created_at: datetime
    updated_at: Optional[datetime]
    product: Optional[Product] = None
    baker: Optional[User] = None

    class Config:
        from_attributes = True


class LossRecordBase(BaseModel):
    store_id: int
    batch_id: Optional[int] = None
    ingredient_id: Optional[int] = None
    loss_type: LossType
    quantity: float
    unit: Optional[str] = None
    unit_price: float = 0.0
    remark: Optional[str] = None


class LossRecordCreate(LossRecordBase):
    pass


class LossRecordUpdate(BaseModel):
    loss_type: Optional[LossType] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    handler_id: Optional[int] = None
    remark: Optional[str] = None
    handle_result: Optional[str] = None
    handled_at: Optional[datetime] = None


class LossRecord(LossRecordBase):
    id: int
    total_amount: float
    reported_by: Optional[int] = None
    handler_id: Optional[int] = None
    handle_result: Optional[str] = None
    handled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    store_id: int
    ingredient_id: int
    quantity: float = 0.0
    min_stock: float = 10.0
    remark: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    min_stock: Optional[float] = None
    status: Optional[InventoryStatus] = None
    last_restocked: Optional[datetime] = None
    last_check: Optional[datetime] = None
    remark: Optional[str] = None


class InventoryItem(InventoryItemBase):
    id: int
    status: InventoryStatus
    last_restocked: Optional[datetime] = None
    last_check: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]
    ingredient: Optional[Ingredient] = None

    class Config:
        from_attributes = True


class StockAlertBase(BaseModel):
    inventory_item_id: int
    store_id: Optional[int] = None
    alert_level: str = "warning"
    current_quantity: Optional[float] = None
    min_stock: Optional[float] = None


class StockAlertCreate(StockAlertBase):
    pass


class StockAlertUpdate(BaseModel):
    handler_id: Optional[int] = None
    remark: Optional[str] = None
    handle_result: Optional[str] = None
    is_handled: Optional[bool] = None
    handled_at: Optional[datetime] = None


class StockAlert(StockAlertBase):
    id: int
    is_handled: bool
    handler_id: Optional[int] = None
    remark: Optional[str] = None
    handle_result: Optional[str] = None
    handled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InspectionTaskBase(BaseModel):
    store_id: int
    supervisor_id: Optional[int] = None
    store_manager_id: Optional[int] = None
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    check_items: Optional[Dict[str, Any]] = None
    scheduled_date: Optional[date] = None
    remark: Optional[str] = None


class InspectionTaskCreate(InspectionTaskBase):
    pass


class InspectionTaskUpdate(BaseModel):
    supervisor_id: Optional[int] = None
    store_manager_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    check_items: Optional[Dict[str, Any]] = None
    status: Optional[InspectionStatus] = None
    scheduled_date: Optional[date] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    score: Optional[float] = None
    remark: Optional[str] = None


class InspectionTask(InspectionTaskBase):
    id: int
    task_no: str
    status: InspectionStatus
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InspectionCheckRecordBase(BaseModel):
    inspection_id: int
    check_item: str = Field(..., max_length=200)
    category: Optional[str] = None
    is_pass: bool = False
    remark: Optional[str] = None
    image_urls: Optional[List[str]] = None


class InspectionCheckRecordCreate(InspectionCheckRecordBase):
    pass


class InspectionCheckRecord(InspectionCheckRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RectificationTaskBase(BaseModel):
    inspection_id: int
    assignee_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    requirement: Optional[str] = None
    deadline: Optional[datetime] = None


class RectificationTaskCreate(RectificationTaskBase):
    pass


class RectificationTaskUpdate(BaseModel):
    assignee_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    requirement: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[RectificationStatus] = None
    rectification_result: Optional[str] = None
    re_inspection_result: Optional[str] = None
    image_urls: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    re_inspected_at: Optional[datetime] = None


class RectificationTask(RectificationTaskBase):
    id: int
    rectification_no: str
    status: RectificationStatus
    rectification_result: Optional[str] = None
    re_inspection_result: Optional[str] = None
    image_urls: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    re_inspected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CashFlowBase(BaseModel):
    store_id: int
    flow_type: CashFlowType
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    operator_id: Optional[int] = None
    transaction_time: Optional[datetime] = None
    remark: Optional[str] = None


class CashFlowCreate(CashFlowBase):
    pass


class CashFlow(CashFlowBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LaborRecordBase(BaseModel):
    store_id: int
    user_id: int
    work_date: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    regular_hours: float = 0.0
    overtime_hours: float = 0.0
    hourly_rate: float = 0.0
    overtime_rate: float = 0.0
    work_content: Optional[str] = None


class LaborRecordCreate(LaborRecordBase):
    pass


class LaborRecordUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    regular_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    hourly_rate: Optional[float] = None
    overtime_rate: Optional[float] = None
    work_content: Optional[str] = None


class LaborRecord(LaborRecordBase):
    id: int
    total_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


class SystemSettingBase(BaseModel):
    module: ModuleType
    key: str = Field(..., max_length=100)
    value: Optional[str] = None
    value_type: str = "string"
    description: Optional[str] = None
    is_enabled: bool = True


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    value_type: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None


class SystemSetting(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class LaborCostStats(BaseModel):
    store_id: int
    store_name: str
    period: str
    total_regular_hours: float
    total_overtime_hours: float
    total_regular_cost: float
    total_overtime_cost: float
    total_cost: float
    employee_count: int


class LossStats(BaseModel):
    store_id: int
    store_name: str
    period: str
    total_loss_amount: float
    loss_type_breakdown: Dict[str, float]
    top_ingredients: List[Dict[str, Any]]
