from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class RoomStatusType(str, enum.Enum):
    OCCUPIED = "occupied"
    CHECKED_OUT = "checked_out"
    CLEANING = "cleaning"
    CLEANING_COMPLETED = "cleaning_completed"
    INSPECTING = "inspecting"
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    BLOCKED = "blocked"


class RoomStatus(Base):
    __tablename__ = "room_statuses"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(RoomStatusType), nullable=False, default=RoomStatusType.AVAILABLE)
    guest_name = Column(String(100))
    check_in_time = Column(DateTime(timezone=True))
    check_out_time = Column(DateTime(timezone=True))
    current_cleaning_task_id = Column(Integer, ForeignKey("cleaning_tasks.id"), nullable=True)
    remarks = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="room_statuses")
    current_cleaning_task = relationship("CleaningTask", foreign_keys=[current_cleaning_task_id])

    __table_args__ = (
        UniqueConstraint('property_id', 'date', name='uq_property_date'),
    )
