from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Any, Generic, TypeVar, List
from datetime import datetime
from app.enums import (
    SeatStatus, SeatArea, TicketType, OrderStatus, RefundStatus,
    RegistrationStatus, EventStatus, ConfigStatus, PaymentMethod, UserRole
)

T = TypeVar("T")


class PageResult(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ResponseModel(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: Optional[T] = None


class IDModel(BaseModel):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TimestampModel(BaseModel):
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    phone: Optional[str] = None
    real_name: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    real_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserOut(UserBase, IDModel, TimestampModel):
    pass


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EventBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=32)
    name: str = Field(..., min_length=2, max_length=256)
    artist: Optional[str] = None
    venue: str = Field(..., max_length=256)
    address: Optional[str] = None
    start_time: datetime
    end_time: datetime
    door_time: Optional[datetime] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    status: EventStatus = EventStatus.DRAFT
    total_seats: int = 0
    max_tickets_per_order: int = 4
    sales_start_time: datetime
    sales_end_time: datetime
    refund_deadline: Optional[datetime] = None
    requires_registration: bool = False
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    extra_data: Optional[dict] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    artist: Optional[str] = None
    venue: Optional[str] = None
    address: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    door_time: Optional[datetime] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[EventStatus] = None
    max_tickets_per_order: Optional[int] = None
    sales_start_time: Optional[datetime] = None
    sales_end_time: Optional[datetime] = None
    refund_deadline: Optional[datetime] = None
    requires_registration: Optional[bool] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    extra_data: Optional[dict] = None


class EventOut(EventBase, IDModel, TimestampModel):
    sold_seats: int = 0
    reserved_seats: int = 0
    blocked_seats: int = 0
    occupancy_rate: Optional[float] = None


class SeatBase(BaseModel):
    event_id: int
    seat_code: str
    row: str
    col: int
    area: SeatArea
    status: SeatStatus = SeatStatus.AVAILABLE
    base_price: float = 0
    current_price: float = 0
    ticket_type_id: Optional[int] = None
    ticket_type_config_id: Optional[int] = None
    notes: Optional[str] = None
    extra_data: Optional[dict] = None


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    status: Optional[SeatStatus] = None
    base_price: Optional[float] = None
    current_price: Optional[float] = None
    ticket_type_id: Optional[int] = None
    ticket_type_config_id: Optional[int] = None
    notes: Optional[str] = None
    extra_data: Optional[dict] = None


class SeatOut(SeatBase, IDModel, TimestampModel):
    order_id: Optional[int] = None
    lock_key: Optional[str] = None
    locked_at: Optional[datetime] = None
    lock_expires_at: Optional[datetime] = None
    ticket_type_name: Optional[str] = None
    ticket_type_config_name: Optional[str] = None


class SeatLockRequest(BaseModel):
    event_id: int
    seat_ids: List[int]
    session_id: Optional[str] = None


class SeatUnlockRequest(BaseModel):
    lock_key: str


class TicketTypeBase(BaseModel):
    code: str
    name: str
    type: TicketType
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0
    is_default: bool = False


class TicketTypeCreate(TicketTypeBase):
    pass


class TicketTypeUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TicketType] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_default: Optional[bool] = None


class TicketTypeOut(TicketTypeBase, IDModel, TimestampModel):
    pass


class TicketTypeConfigBase(BaseModel):
    event_id: int
    ticket_type_id: int
    price: float = 0
    original_price: float = 0
    total_inventory: int = 0
    min_per_order: int = 1
    max_per_order: int = 10
    sales_start_time: Optional[datetime] = None
    sales_end_time: Optional[datetime] = None
    is_active: bool = True
    sort_order: int = 0
    extra_data: Optional[dict] = None


class TicketTypeConfigCreate(TicketTypeConfigBase):
    pass


class TicketTypeConfigUpdate(BaseModel):
    price: Optional[float] = None
    original_price: Optional[float] = None
    total_inventory: Optional[int] = None
    min_per_order: Optional[int] = None
    max_per_order: Optional[int] = None
    sales_start_time: Optional[datetime] = None
    sales_end_time: Optional[datetime] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    extra_data: Optional[dict] = None


class TicketTypeConfigOut(TicketTypeConfigBase, IDModel, TimestampModel):
    sold_count: int = 0
    reserved_count: int = 0
    available_count: int = 0
    ticket_type_name: Optional[str] = None
    ticket_type_color: Optional[str] = None
    ticket_type_code: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    order_id: int
    seat_id: int
    seat_code: str
    area: str
    row: str
    col: int
    original_price: float
    sale_price: float
    discount_amount: float
    refund_amount: float
    is_refunded: bool
    refunded_at: Optional[datetime] = None
    ticket_no: Optional[str] = None
    checked_in: bool
    checked_in_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    event_id: int
    seat_ids: List[int]
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    remark: Optional[str] = None
    cancel_reason: Optional[str] = None


class PaymentCreate(BaseModel):
    order_id: int
    payment_method: PaymentMethod
    amount: Optional[float] = None


class OrderOut(IDModel, TimestampModel):
    order_no: str
    user_id: int
    event_id: int
    event_name: Optional[str] = None
    status: OrderStatus
    total_amount: float
    discount_amount: float
    pay_amount: float
    refund_amount: float
    ticket_count: int
    payment_method: Optional[PaymentMethod] = None
    payment_trade_no: Optional[str] = None
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    remark: Optional[str] = None
    cancel_reason: Optional[str] = None
    items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class RefundRequestBase(BaseModel):
    order_id: int
    refund_amount: float
    reason: str
    seat_ids: List[int]


class RefundRequestCreate(RefundRequestBase):
    pass


class RefundReview(BaseModel):
    approved: bool
    review_remark: Optional[str] = None
    fee_amount: Optional[float] = None


class RefundRequestOut(IDModel, TimestampModel):
    refund_no: str
    order_id: int
    order_no: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    event_id: Optional[int] = None
    event_name: Optional[str] = None
    status: RefundStatus
    refund_amount: float
    fee_amount: float
    actual_amount: float
    reason: str
    seat_ids: List[int]
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_remark: Optional[str] = None
    refund_method: Optional[PaymentMethod] = None
    refund_trade_no: Optional[str] = None
    refunded_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class RegistrationBase(BaseModel):
    event_id: int
    form_data: dict


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationReview(BaseModel):
    approved: bool
    review_remark: Optional[str] = None


class RegistrationOut(IDModel, TimestampModel):
    event_id: int
    event_name: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    status: RegistrationStatus
    form_data: dict
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_remark: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SystemConfigBase(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    category: str = "general"
    value_type: str = "string"
    value: Any
    status: ConfigStatus = ConfigStatus.DRAFT
    sort_order: int = 0
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    value_type: Optional[str] = None
    value: Optional[Any] = None
    status: Optional[ConfigStatus] = None
    sort_order: Optional[int] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class SystemConfigOut(SystemConfigBase, IDModel, TimestampModel):
    version: int
    change_log: List[dict] = []


class RepeatSeatAlertOut(IDModel):
    alert_key: str
    event_id: int
    event_name: Optional[str] = None
    seat_id: int
    seat_code: Optional[str] = None
    user_identifier: str
    attempt_count: int
    first_attempt_at: datetime
    last_attempt_at: datetime
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolution_note: Optional[str] = None
    window_seconds: int
    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    total_events: int = 0
    active_events: int = 0
    total_orders_today: int = 0
    revenue_today: float = 0.0
    total_revenue: float = 0.0
    pending_refunds: int = 0
    pending_registrations: int = 0
    unresolved_alerts: int = 0


class RevenueReportItem(BaseModel):
    date: str
    order_count: int = 0
    ticket_count: int = 0
    revenue: float = 0.0
    refund_count: int = 0
    refund_amount: float = 0.0
    net_revenue: float = 0.0


class EventReportItem(BaseModel):
    event_id: int
    event_name: str
    event_date: datetime
    total_seats: int
    sold_seats: int
    occupancy_rate: float
    reserved_seats: int
    blocked_seats: int
    total_amount: float
    refund_amount: float
    net_amount: float
    order_count: int


class SeatOccupancyItem(BaseModel):
    area: str
    total: int
    sold: int
    reserved: int
    available: int
    rate: float


class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


class EventSeatGenerateRequest(BaseModel):
    event_id: int
    layouts: List[dict]
