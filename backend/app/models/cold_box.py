import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ColdBox(Base):
    __tablename__ = "cold_boxes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    serial_number = Column(String(64), nullable=False)
    current_temp = Column(Float, nullable=False)
    is_abnormal = Column(Boolean, default=False, nullable=False)
    last_checked_at = Column(DateTime(timezone=True), server_default=func.now())

    route = relationship("Route", back_populates="cold_box")
    alerts = relationship("ColdBoxAlert", back_populates="cold_box", cascade="all, delete-orphan")


class ColdBoxAlert(Base):
    __tablename__ = "cold_box_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cold_box_id = Column(UUID(as_uuid=True), ForeignKey("cold_boxes.id", ondelete="CASCADE"), nullable=False)
    temperature = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    review_task_id = Column(UUID(as_uuid=True), ForeignKey("review_tasks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_resolved = Column(Boolean, default=False, nullable=False)

    cold_box = relationship("ColdBox", back_populates="alerts")
    review_task = relationship("ReviewTask", back_populates="alert")


class ReviewTask(Base):
    __tablename__ = "review_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_type = Column(String(32), nullable=False)
    related_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    assigned_to = Column(String(64), nullable=True)
    result = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    alert = relationship("ColdBoxAlert", back_populates="review_task")
