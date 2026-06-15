from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean,
    ForeignKey, UniqueConstraint, Index, JSON, BigInteger, Enum as SAEnum
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from app.database import Base
from app.enums import (
    SeatStatus, SeatArea, TicketType as TicketTypeEnum, OrderStatus, RefundStatus,
    RegistrationStatus, EventStatus, ConfigStatus, PaymentMethod, UserRole
)
from app.utils import now


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now, nullable=False)
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), index=True)
    real_name: Mapped[str | None] = mapped_column(String(64))
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, native_enum=False, name="user_role"), default=UserRole.USER, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    events = relationship("Event", back_populates="creator", foreign_keys="Event.created_by")
    orders = relationship("Order", back_populates="user", foreign_keys="Order.user_id")
    registrations = relationship("Registration", back_populates="user", foreign_keys="Registration.user_id")


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    artist: Mapped[str | None] = mapped_column(String(256))
    venue: Mapped[str] = mapped_column(String(256), nullable=False)
    address: Mapped[str | None] = mapped_column(String(512))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    door_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    description: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[EventStatus] = mapped_column(SAEnum(EventStatus, native_enum=False, name="event_status"), default=EventStatus.DRAFT, nullable=False, index=True)
    total_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sold_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    blocked_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_tickets_per_order: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    sales_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sales_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    refund_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    requires_registration: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    registration_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    registration_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extra_data: Mapped[dict | None] = mapped_column(JSON, default=dict)

    creator = relationship("User", back_populates="events", foreign_keys="Event.created_by")
    seats = relationship("Seat", back_populates="event", cascade="all, delete-orphan")
    ticket_types = relationship("TicketTypeConfig", back_populates="event", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="event")
    registrations = relationship("Registration", back_populates="event")
    seat_layouts = relationship("SeatLayout", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_event_status_time", "status", "start_time"),
    )


class SeatLayout(Base, TimestampMixin):
    __tablename__ = "seat_layouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    rows: Mapped[int] = mapped_column(Integer, nullable=False)
    cols: Mapped[int] = mapped_column(Integer, nullable=False)
    layout_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    event = relationship("Event", back_populates="seat_layouts")


class Seat(Base, TimestampMixin):
    __tablename__ = "seats"
    __table_args__ = (
        UniqueConstraint("event_id", "row", "col", name="uq_event_seat_row_col"),
        Index("idx_seat_event_status", "event_id", "status"),
        Index("idx_seat_event_area", "event_id", "area"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    seat_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    row: Mapped[str] = mapped_column(String(16), nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    area: Mapped[SeatArea] = mapped_column(SAEnum(SeatArea, native_enum=False, name="seat_area"), nullable=False, index=True)
    status: Mapped[SeatStatus] = mapped_column(SAEnum(SeatStatus, native_enum=False, name="seat_status"), default=SeatStatus.AVAILABLE, nullable=False, index=True)
    base_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    ticket_type_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("ticket_types.id"), index=True)
    ticket_type_config_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("ticket_type_configs.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("orders.id"), index=True)
    lock_key: Mapped[str | None] = mapped_column(String(128), index=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lock_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(String(512))
    extra_data: Mapped[dict | None] = mapped_column(JSON, default=dict)

    event = relationship("Event", back_populates="seats")
    order = relationship("Order", back_populates="seats")
    ticket_type = relationship("TicketType", foreign_keys=[ticket_type_id])
    ticket_type_config = relationship("TicketTypeConfig", back_populates="seats", foreign_keys=[ticket_type_config_id])


class TicketType(Base, TimestampMixin):
    __tablename__ = "ticket_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[TicketTypeEnum] = mapped_column(SAEnum(TicketTypeEnum, native_enum=False, name="ticket_type"), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(16))
    icon: Mapped[str | None] = mapped_column(String(64))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    event_configs = relationship("TicketTypeConfig", back_populates="ticket_type")


class TicketTypeConfig(Base, TimestampMixin):
    __tablename__ = "ticket_type_configs"
    __table_args__ = (
        UniqueConstraint("event_id", "ticket_type_id", name="uq_event_ticket_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    ticket_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("ticket_types.id"), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    original_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    total_inventory: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sold_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    min_per_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_per_order: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    sales_start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sales_end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extra_data: Mapped[dict | None] = mapped_column(JSON, default=dict)

    event = relationship("Event", back_populates="ticket_types")
    ticket_type = relationship("TicketType", back_populates="event_configs")
    seats = relationship("Seat", back_populates="ticket_type_config")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, native_enum=False, name="order_status"), default=OrderStatus.PENDING, nullable=False, index=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    pay_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    refund_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    ticket_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payment_method: Mapped[PaymentMethod | None] = mapped_column(SAEnum(PaymentMethod, native_enum=False, name="payment_method"), index=True)
    payment_trade_no: Mapped[str | None] = mapped_column(String(128), index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    contact_name: Mapped[str | None] = mapped_column(String(64))
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    contact_email: Mapped[str | None] = mapped_column(String(128))
    remark: Mapped[str | None] = mapped_column(Text)
    cancel_reason: Mapped[str | None] = mapped_column(Text)
    extra_data: Mapped[dict | None] = mapped_column(JSON, default=dict)

    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    event = relationship("Event", back_populates="orders")
    seats = relationship("Seat", back_populates="order")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    refunds = relationship("RefundRequest", back_populates="order")

    __table_args__ = (
        Index("idx_order_user_status", "user_id", "status"),
        Index("idx_order_event_status", "event_id", "status"),
        Index("idx_order_created_at", "created_at"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    seat_id: Mapped[int] = mapped_column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    ticket_type_config_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("ticket_type_configs.id"), index=True)
    seat_code: Mapped[str] = mapped_column(String(64), nullable=False)
    area: Mapped[str] = mapped_column(String(32), nullable=False)
    row: Mapped[str] = mapped_column(String(16), nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    original_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    sale_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    refund_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    is_refunded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ticket_no: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    checked_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order = relationship("Order", back_populates="items")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    payment_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod, native_enum=False, name="payment_method"), nullable=False, index=True)
    trade_no: Mapped[str | None] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw_response: Mapped[dict | None] = mapped_column(JSON, default=dict)
    remark: Mapped[str | None] = mapped_column(Text)

    order = relationship("Order", back_populates="payments")


class RefundRequest(Base, TimestampMixin):
    __tablename__ = "refund_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    refund_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[RefundStatus] = mapped_column(SAEnum(RefundStatus, native_enum=False, name="refund_status"), default=RefundStatus.PENDING, nullable=False, index=True)
    refund_amount: Mapped[float] = mapped_column(Float, nullable=False)
    fee_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    actual_amount: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    seat_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_remark: Mapped[str | None] = mapped_column(Text)
    refund_method: Mapped[PaymentMethod | None] = mapped_column(SAEnum(PaymentMethod, native_enum=False, name="payment_method"))
    refund_trade_no: Mapped[str | None] = mapped_column(String(128))
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw_response: Mapped[dict | None] = mapped_column(JSON, default=dict)

    order = relationship("Order", back_populates="refunds")

    __table_args__ = (
        Index("idx_refund_status_created", "status", "created_at"),
    )


class Registration(Base, TimestampMixin):
    __tablename__ = "registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_registration"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[RegistrationStatus] = mapped_column(SAEnum(RegistrationStatus, native_enum=False, name="registration_status"), default=RegistrationStatus.PENDING, nullable=False, index=True)
    form_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_remark: Mapped[str | None] = mapped_column(Text)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="registrations", foreign_keys=[user_id])


class SystemConfig(Base, TimestampMixin):
    __tablename__ = "system_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), default="general", nullable=False, index=True)
    value_type: Mapped[str] = mapped_column(String(32), default="string", nullable=False)
    value: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[ConfigStatus] = mapped_column(SAEnum(ConfigStatus, native_enum=False, name="config_status"), default=ConfigStatus.DRAFT, nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    change_log: Mapped[list] = mapped_column(JSON, default=list)

    __table_args__ = (
        Index("idx_config_category_status", "category", "status"),
    )


class RepeatSeatAlert(Base):
    __tablename__ = "repeat_seat_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_key: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    seat_id: Mapped[int] = mapped_column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    user_identifier: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    attempt_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    first_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    resolution_note: Mapped[str | None] = mapped_column(Text)
    window_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    extra_data: Mapped[dict | None] = mapped_column(JSON, default=dict)

    __table_args__ = (
        Index("idx_alert_event_resolved", "event_id", "is_resolved"),
        Index("idx_alert_user_event", "user_identifier", "event_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(64), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    old_value: Mapped[dict | None] = mapped_column(JSON)
    new_value: Mapped[dict | None] = mapped_column(JSON)
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, nullable=False, index=True)

    __table_args__ = (
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_user_action", "user_id", "action"),
    )
