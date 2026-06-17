from datetime import datetime
from enum import Enum
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field


T = TypeVar("T")


class OrderStatus(str, Enum):
    PENDING = "pending"
    SHOOTING = "shooting"
    SELECTING = "selecting"
    SELECTED = "selected"
    EDITING = "editing"
    DELIVERED = "delivered"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DeliveryNodeType(str, Enum):
    SHOOT_COMPLETE = "shoot_complete"
    SELECT_CONFIRM = "select_confirm"
    EDIT_START = "edit_start"
    FIRST_DRAFT = "first_draft"
    REVISION = "revision"
    FINAL_DELIVER = "final_deliver"
    CUSTOMER_CONFIRM = "customer_confirm"


class ExceptionType(str, Enum):
    PRICE_DIFF = "price_diff"
    QUANTITY_DIFF = "quantity_diff"
    TIMEOUT_DIFF = "timeout_diff"
    QUALITY_DIFF = "quality_diff"
    OTHER_DIFF = "other_diff"


class ExceptionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class UserRole(str, Enum):
    PHOTOGRAPHER = "photographer"
    ADMIN = "admin"
    VIDEO_LEAD = "video_lead"
    CUSTOMER = "customer"


class ApiResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class UserBase(BaseModel):
    username: str
    real_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    is_test_account: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_test_account: Optional[bool] = None


class User(UserBase):
    id: int
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    order_no: str
    customer_name: str
    customer_phone: str
    photographer_id: int
    shoot_type: str
    shoot_date: datetime
    total_amount: float
    prepaid_amount: float = 0.0
    photo_count: int
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    photographer_id: Optional[int] = None
    shoot_type: Optional[str] = None
    shoot_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    prepaid_amount: Optional[float] = None
    photo_count: Optional[int] = None
    status: Optional[OrderStatus] = None
    remark: Optional[str] = None


class Order(OrderBase):
    id: int
    status: OrderStatus
    selected_count: int = 0
    delivered_count: int = 0
    is_test_data: bool = False
    created_at: datetime
    updated_at: datetime
    photographer: Optional[User] = None

    class Config:
        from_attributes = True


class OrderListFilter(BaseModel):
    status: Optional[OrderStatus] = None
    photographer_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    keyword: Optional[str] = None
    page: int = 1
    page_size: int = 20


class DeliveryNodeBase(BaseModel):
    order_id: int
    node_type: DeliveryNodeType
    node_name: str
    expected_at: datetime
    operator_id: Optional[int] = None
    remark: Optional[str] = None


class DeliveryNodeCreate(DeliveryNodeBase):
    pass


class DeliveryNode(DeliveryNodeBase):
    id: int
    actual_at: Optional[datetime] = None
    is_completed: bool = False
    created_at: datetime
    operator: Optional[User] = None

    class Config:
        from_attributes = True


class PhotoSelectionBase(BaseModel):
    order_id: int
    photo_key: str
    thumbnail_url: str
    original_url: str
    is_selected: bool = False
    selection_note: Optional[str] = None


class PhotoSelection(PhotoSelectionBase):
    id: int
    selected_at: Optional[datetime] = None
    selected_by: Optional[int] = None

    class Config:
        from_attributes = True


class PhotoSelectionUpdate(BaseModel):
    is_selected: bool
    selection_note: Optional[str] = None


class BatchPhotoSelection(BaseModel):
    photo_ids: List[int]
    is_selected: bool = True
    selection_note: Optional[str] = None


class DeliveryFileBase(BaseModel):
    order_id: int
    file_name: str
    file_path: str
    file_size: int
    file_type: str
    is_downloaded: bool = False


class DeliveryFile(DeliveryFileBase):
    id: int
    download_count: int = 0
    last_downloaded_at: Optional[datetime] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ExceptionTicketBase(BaseModel):
    order_id: int
    exception_type: ExceptionType
    title: str
    description: str
    amount_diff: float = 0.0
    assignee_id: Optional[int] = None


class ExceptionTicketCreate(ExceptionTicketBase):
    pass


class ExceptionTicketUpdate(BaseModel):
    status: Optional[ExceptionStatus] = None
    assignee_id: Optional[int] = None
    resolution: Optional[str] = None


class ExceptionTicket(ExceptionTicketBase):
    id: int
    status: ExceptionStatus
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    assignee: Optional[User] = None
    resolver: Optional[User] = None

    class Config:
        from_attributes = True


class ExceptionLogBase(BaseModel):
    ticket_id: int
    action: str
    remark: Optional[str] = None
    operator_id: int


class ExceptionLog(ExceptionLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SatisfactionBase(BaseModel):
    order_id: int
    rating: int = Field(ge=1, le=5)
    feedback: Optional[str] = None
    rated_by: int


class Satisfaction(SatisfactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    order_id: int
    invoice_no: str
    amount: float
    invoice_date: datetime
    status: str
    is_received: bool = False


class Invoice(InvoiceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialAuthorizationBase(BaseModel):
    order_id: int
    material_type: str
    scope: str
    valid_from: datetime
    valid_to: datetime
    is_approved: bool = False


class MaterialAuthorization(MaterialAuthorizationBase):
    id: int
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None

    class Config:
        from_attributes = True


class SatisfactionTraceFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    photographer_id: Optional[int] = None
    min_rating: Optional[int] = None
    max_rating: Optional[int] = None
    order_status: Optional[OrderStatus] = None
    exclude_test_data: bool = True


class SatisfactionStats(BaseModel):
    total_orders: int = 0
    avg_rating: float = 0.0
    rating_distribution: dict = {}
    by_photographer: List[dict] = []
    by_date: List[dict] = []
    by_status: List[dict] = []


class DashboardStats(BaseModel):
    pending_orders: int = 0
    selecting_orders: int = 0
    delivering_orders: int = 0
    completed_orders: int = 0
    pending_exceptions: int = 0
    pending_invoices: int = 0
    monthly_revenue: float = 0.0
    avg_satisfaction: float = 0.0


class PaginationResult[T](BaseModel):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
