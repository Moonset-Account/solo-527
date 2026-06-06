from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class MaintenanceOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    INSPECTING = "inspecting"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class MaintenanceType(str, enum.Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    APPLIANCE = "appliance"
    FURNITURE = "furniture"
    PAINTING = "painting"
    DOOR_WINDOW = "door_window"
    OTHER = "other"


class MaintenancePriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class MaintenanceOrder(Base):
    __tablename__ = "maintenance_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(MaintenanceOrderStatus), default=MaintenanceOrderStatus.PENDING, nullable=False, index=True)
    maintenance_type = Column(Enum(MaintenanceType), nullable=False)
    priority = Column(Enum(MaintenancePriority), default=MaintenancePriority.NORMAL)
    scheduled_time = Column(DateTime(timezone=True))
    deadline_time = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    submitted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    solution = Column(Text)
    inspector_remarks = Column(Text)
    is_overdue = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="maintenance_orders")
    technician = relationship("User", back_populates="assigned_maintenance_orders", foreign_keys=[technician_id])
    creator = relationship("User", back_populates="created_orders", foreign_keys=[created_by])
    attachments = relationship("Attachment", back_populates="maintenance_order", cascade="all, delete-orphan")
    material_usages = relationship("MaterialUsage", back_populates="maintenance_order", cascade="all, delete-orphan")
