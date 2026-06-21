import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Boolean,
    ForeignKey, Float, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUND_REQUESTED = "refund_requested"
    REFUNDED = "refunded"


class TechnicianStatus(str, enum.Enum):
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    LEAVE = "leave"


class RefundReason(str, enum.Enum):
    NOT_REPAIRED = "not_repaired"
    OVERCHARGED = "overcharged"
    BAD_SERVICE = "bad_service"
    SECONDARY_DAMAGE = "secondary_damage"
    OTHER = "other"


class ActionType(str, enum.Enum):
    CREATE_ORDER = "create_order"
    ASSIGN_TECHNICIAN = "assign_technician"
    UPDATE_STATUS = "update_status"
    SCHEDULE = "schedule"
    REFUND = "refund"
    REVIEW = "review"
    UPDATE_TECHNICIAN = "update_technician"


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    city = Column(String(100))
    description = Column(Text)
    demand_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    communities = relationship("Community", back_populates="region", cascade="all, delete-orphan")
    orders = relationship("RepairOrder", back_populates="region")


class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    address_prefix = Column(String(200))
    demand_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="communities")
    orders = relationship("RepairOrder", back_populates="community")
    technicians = relationship("Technician", back_populates="community")


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    skill_level = Column(Integer, default=1)
    status = Column(String(20), default=TechnicianStatus.IDLE.value)
    community_id = Column(Integer, ForeignKey("communities.id"))
    daily_max_orders = Column(Integer, default=8)
    today_orders = Column(Integer, default=0)
    total_completed = Column(Integer, default=0)
    rating_avg = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    community = relationship("Community", back_populates="technicians")
    orders = relationship("RepairOrder", back_populates="technician")
    work_records = relationship("WorkRecord", back_populates="technician", cascade="all, delete-orphan")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    appliance_type = Column(String(50))
    fault_description = Column(Text)
    fault_photos = Column(JSON, default=list)
    status = Column(String(30), default=OrderStatus.PENDING.value, index=True)
    priority = Column(Integer, default=1)

    region_id = Column(Integer, ForeignKey("regions.id"))
    community_id = Column(Integer, ForeignKey("communities.id"))
    address_detail = Column(String(300), nullable=False)
    full_address = Column(String(400))

    schedule_date = Column(Date, index=True)
    schedule_time_slot = Column(String(50))
    appointment_time = Column(DateTime)

    technician_id = Column(Integer, ForeignKey("technicians.id"))
    assigned_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    repair_fee = Column(Float, default=0)
    parts_fee = Column(Float, default=0)
    total_fee = Column(Float, default=0)
    paid = Column(Boolean, default=False)

    refund_reason = Column(String(30))
    refund_note = Column(Text)
    refund_amount = Column(Float, default=0)
    refunded_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    region = relationship("Region", back_populates="orders")
    community = relationship("Community", back_populates="orders")
    technician = relationship("Technician", back_populates="orders")
    review = relationship("Review", back_populates="order", uselist=False, cascade="all, delete-orphan")
    work_records = relationship("WorkRecord", back_populates="order", cascade="all, delete-orphan")
    action_logs = relationship("ActionLog", back_populates="order", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), unique=True, nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"))
    rating = Column(Integer, default=5)
    comment = Column(Text)
    revisit_note = Column(Text)
    revisited = Column(Boolean, default=False)
    revisited_by = Column(String(100))
    revisited_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RepairOrder", back_populates="review")


class WorkRecord(Base):
    __tablename__ = "work_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    work_date = Column(Date, index=True, default=date.today)
    community_id = Column(Integer, ForeignKey("communities.id"))
    hours_spent = Column(Float, default=1)
    status = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RepairOrder", back_populates="work_records")
    technician = relationship("Technician", back_populates="work_records")


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    action_type = Column(String(30), nullable=False)
    operator = Column(String(100), nullable=False)
    detail = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    order = relationship("RepairOrder", back_populates="action_logs")
