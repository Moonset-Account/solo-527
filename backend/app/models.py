from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(50))
    student_id = Column(String(20), unique=True, index=True)
    dorm_room = Column(String(20))
    phone = Column(String(20))
    role = Column(Enum("student", "staff", "admin", name="user_role"), default="student", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    repair_orders = relationship("RepairOrder", back_populates="student", foreign_keys="RepairOrder.student_id")
    audit_records = relationship("AuditRecord", back_populates="reviewer", foreign_keys="AuditRecord.reviewer_id")
    operation_histories = relationship("OperationHistory", back_populates="operator", foreign_keys="OperationHistory.operator_id")
    notification_receipts = relationship("NotificationReceipt", back_populates="user", foreign_keys="NotificationReceipt.user_id")
    second_hand_trades = relationship("SecondHandTrade", back_populates="seller", foreign_keys="SecondHandTrade.seller_id")
    seat_violations = relationship("SeatViolation", back_populates="student", foreign_keys="SeatViolation.student_id")
    export_records = relationship("ExportRecord", back_populates="operator", foreign_keys="ExportRecord.operator_id")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(Enum("plumbing", "electrical", "furniture", "door_window", "other", name="repair_category"), nullable=False)
    location = Column(String(200))
    dorm_room = Column(String(20))
    status = Column(Enum("pending", "in_review", "approved", "rejected", "in_progress", "completed", "closed", name="repair_status"), default="pending", nullable=False)
    urgency = Column(Enum("low", "medium", "high", name="repair_urgency"), default="medium", nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", back_populates="repair_orders", foreign_keys=[student_id])
    attachments = relationship("Attachment", back_populates="order", cascade="all, delete-orphan")
    audit_records = relationship("AuditRecord", back_populates="order", cascade="all, delete-orphan")
    operation_histories = relationship("OperationHistory", back_populates="order", cascade="all, delete-orphan")
    notification_receipts = relationship("NotificationReceipt", back_populates="order", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RepairOrder", back_populates="attachments")


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Enum("approve", "reject", "assign", "complete", name="audit_action"), nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RepairOrder", back_populates="audit_records")
    reviewer = relationship("User", back_populates="audit_records", foreign_keys=[reviewer_id])


class OperationHistory(Base):
    __tablename__ = "operation_histories"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    field_name = Column(String(50), nullable=False)
    old_value = Column(String(255))
    new_value = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RepairOrder", back_populates="operation_histories")
    operator = relationship("User", back_populates="operation_histories", foreign_keys=[operator_id])


class NotificationReceipt(Base):
    __tablename__ = "notification_receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    channel = Column(Enum("sms", "email", "in_app", name="notification_channel"), nullable=False)
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notification_receipts", foreign_keys=[user_id])
    order = relationship("RepairOrder", back_populates="notification_receipts")


class ClubActivity(Base):
    __tablename__ = "club_activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    organizer = Column(String(100))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    location = Column(String(200))
    status = Column(String(20), default="upcoming")
    created_at = Column(DateTime, default=datetime.utcnow)


class SecondHandTrade(Base):
    __tablename__ = "second_hand_trades"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Float)
    category = Column(String(50))
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact = Column(String(100))
    status = Column(String(20), default="available")
    created_at = Column(DateTime, default=datetime.utcnow)

    seller = relationship("User", back_populates="second_hand_trades", foreign_keys=[seller_id])


class SeatViolation(Base):
    __tablename__ = "seat_violations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seat_number = Column(String(20))
    library_room = Column(String(100))
    violation_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="seat_violations", foreign_keys=[student_id])


class ExportRecord(Base):
    __tablename__ = "export_records"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    export_type = Column(String(50), nullable=False)
    filter_params = Column(JSON)
    file_path = Column(String(500))
    generated_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User", back_populates="export_records", foreign_keys=[operator_id])
