from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, Date, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    FRONTLINE = "frontline"
    ADMIN = "admin"
    MANAGER = "manager"


class TreatmentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SOLD_OUT = "sold_out"


class TreatmentCardStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED_UP = "used_up"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIAL = "partial"


class WorkStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    HIDDEN = "hidden"


class CommentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MessageType(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ALERT = "alert"


class TodoStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.FRONTLINE)
    phone = Column(String(20))
    email = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_verifications = relationship("Verification", back_populates="operator", foreign_keys="Verification.operator_id")
    created_payments = relationship("PaymentRecord", back_populates="cashier", foreign_keys="PaymentRecord.cashier_id")
    created_works = relationship("Work", back_populates="creator")
    assigned_todos = relationship("Todo", back_populates="assignee", foreign_keys="Todo.assignee_id")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True, nullable=False)
    gender = Column(String(10))
    birthday = Column(Date)
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    treatment_cards = relationship("TreatmentCard", back_populates="customer")
    verifications = relationship("Verification", back_populates="customer")
    comments = relationship("Comment", back_populates="customer")


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, default=60)
    total_sessions = Column(Integer, default=1)
    category = Column(String(50))
    status = Column(Enum(TreatmentStatus), default=TreatmentStatus.ACTIVE)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    treatment_cards = relationship("TreatmentCard", back_populates="treatment")
    works = relationship("Work", back_populates="treatment")
    verifications = relationship("Verification", back_populates="treatment")


class TreatmentCard(Base):
    __tablename__ = "treatment_cards"

    id = Column(Integer, primary_key=True, index=True)
    card_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    treatment_id = Column(Integer, ForeignKey("treatments.id"), nullable=False)
    total_sessions = Column(Integer, nullable=False)
    remaining_sessions = Column(Integer, nullable=False)
    purchase_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    status = Column(Enum(TreatmentCardStatus), default=TreatmentCardStatus.ACTIVE)
    price_paid = Column(Numeric(10, 2))
    note = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="treatment_cards")
    treatment = relationship("Treatment", back_populates="treatment_cards")
    verifications = relationship("Verification", back_populates="treatment_card")
    creator = relationship("User", foreign_keys=[creator_id])


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    verification_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    treatment_card_id = Column(Integer, ForeignKey("treatment_cards.id"), nullable=False)
    treatment_id = Column(Integer, ForeignKey("treatments.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sessions_used = Column(Integer, default=1)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.VERIFIED)
    verification_time = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="verifications")
    treatment_card = relationship("TreatmentCard", back_populates="verifications")
    treatment = relationship("Treatment", back_populates="verifications")
    operator = relationship("User", back_populates="created_verifications", foreign_keys=[operator_id])


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    payment_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    treatment_card_id = Column(Integer, ForeignKey("treatment_cards.id"))
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    actual_amount = Column(Numeric(10, 2), nullable=False)
    diff_amount = Column(Numeric(10, 2), default=0)
    payment_method = Column(String(30))
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PAID)
    payment_type = Column(String(30))
    payment_time = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer")
    treatment_card = relationship("TreatmentCard")
    cashier = relationship("User", back_populates="created_payments", foreign_keys=[cashier_id])


class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    treatment_id = Column(Integer, ForeignKey("treatments.id"))
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(WorkStatus), default=WorkStatus.DRAFT)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    treatment = relationship("Treatment", back_populates="works")
    creator = relationship("User", back_populates="created_works")
    comments = relationship("Comment", back_populates="work")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    customer_name = Column(String(100))
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=5)
    status = Column(Enum(CommentStatus), default=CommentStatus.PENDING)
    reply_content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id"))

    work = relationship("Work", back_populates="comments")
    customer = relationship("Customer", back_populates="comments")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    type = Column(Enum(MessageType), default=MessageType.INFO)
    is_read = Column(Boolean, default=False)
    recipient_id = Column(Integer, ForeignKey("users.id"))
    related_type = Column(String(50))
    related_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", foreign_keys=[recipient_id])


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="medium")
    status = Column(Enum(TodoStatus), default=TodoStatus.PENDING)
    assignee_id = Column(Integer, ForeignKey("users.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    due_date = Column(Date)
    related_type = Column(String(50))
    related_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    assignee = relationship("User", back_populates="assigned_todos", foreign_keys=[assignee_id])
    creator = relationship("User", foreign_keys=[creator_id])


class ApiStatus(Base):
    __tablename__ = "api_status"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(200), unique=True, index=True)
    method = Column(String(10))
    last_called = Column(DateTime(timezone=True))
    call_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    avg_response_time = Column(Float, default=0)
    status = Column(String(20), default="healthy")
    last_error = Column(Text)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)
    threshold_value = Column(Numeric(10, 2))
    is_alert = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
