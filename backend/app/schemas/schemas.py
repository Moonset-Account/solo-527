from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "inspector"
    display_name: str
    is_demo: bool = False


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str
    display_name: str
    is_demo: bool
    created_at: Optional[datetime] = None


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    is_demo: bool = False


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    is_demo: bool
    created_at: Optional[datetime] = None


class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"
    is_demo: bool = False


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    status: str
    is_demo: bool
    created_at: Optional[datetime] = None


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class BudgetVersionCreate(BaseModel):
    contract_id: Optional[int] = None
    version: str
    items: List[Any] = []
    is_demo: bool = False


class BudgetVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contract_id: Optional[int] = None
    version: str
    items: List[Any]
    is_demo: bool
    created_at: Optional[datetime] = None


class BudgetVersionUpdate(BaseModel):
    contract_id: Optional[int] = None
    version: Optional[str] = None
    items: Optional[List[Any]] = None


class ContractCreate(BaseModel):
    name: str
    customer_id: int
    plan_id: int
    budget_version_id: Optional[int] = None
    status: str = "draft"
    amount: Decimal = Decimal("0")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_demo: bool = False


class ContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    customer_id: int
    plan_id: int
    budget_version_id: Optional[int] = None
    status: str
    amount: Decimal
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_demo: bool
    created_at: Optional[datetime] = None


class ContractUpdate(BaseModel):
    name: Optional[str] = None
    customer_id: Optional[int] = None
    plan_id: Optional[int] = None
    budget_version_id: Optional[int] = None
    status: Optional[str] = None
    amount: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AcceptanceTemplateCreate(BaseModel):
    name: str
    items: List[Any] = []
    is_demo: bool = False


class AcceptanceTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    items: List[Any]
    is_demo: bool
    created_at: Optional[datetime] = None


class AcceptanceTemplateUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[List[Any]] = None


class InspectionTemplateCreate(BaseModel):
    name: str
    check_items: List[Any] = []
    is_demo: bool = False


class InspectionTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    check_items: List[Any]
    is_demo: bool
    created_at: Optional[datetime] = None


class InspectionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    check_items: Optional[List[Any]] = None


class InspectionTaskCreate(BaseModel):
    contract_id: int
    template_id: Optional[int] = None
    inspector_id: int
    node_name: str
    status: str = "pending"
    deadline: date
    is_demo: bool = False


class InspectionTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contract_id: int
    template_id: Optional[int] = None
    inspector_id: int
    node_name: str
    status: str
    deadline: date
    is_delayed: bool
    is_demo: bool
    created_at: Optional[datetime] = None


class InspectionTaskStatusUpdate(BaseModel):
    status: str


class InspectionRecordCreate(BaseModel):
    quality_score: int = 0
    description: Optional[str] = None
    photos: List[Any] = []
    conclusion: str
    is_demo: bool = False


class InspectionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_id: int
    quality_score: int
    description: Optional[str] = None
    photos: List[Any]
    conclusion: Optional[str] = None
    is_demo: bool
    created_at: Optional[datetime] = None


class SatisfactionRecordCreate(BaseModel):
    contract_id: int
    customer_id: int
    level: str = "pending"
    comment: Optional[str] = None
    is_demo: bool = False


class SatisfactionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contract_id: int
    customer_id: int
    level: str
    comment: Optional[str] = None
    is_demo: bool
    created_at: Optional[datetime] = None


class SatisfactionRecordUpdate(BaseModel):
    level: Optional[str] = None
    comment: Optional[str] = None


class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    content: Optional[str] = None
    is_demo: bool = False


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    type: str
    title: str
    content: Optional[str] = None
    is_read: bool
    is_demo: bool
    created_at: Optional[datetime] = None


class ConfigChangeLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    entity_type: str
    entity_id: int
    action: str
    before_data: Optional[Any] = None
    after_data: Optional[Any] = None
    is_demo: bool
    created_at: Optional[datetime] = None


class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    page_size: int
