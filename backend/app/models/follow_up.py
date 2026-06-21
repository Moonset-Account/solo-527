from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class FollowUpTask(BaseModel):
    __tablename__ = "follow_up_tasks"

    type = Column(String(20), nullable=False)
    related_id = Column(Integer, nullable=False)
    related_type = Column(String(20), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    pet_name = Column(String(100), nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    content = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    next_follow_up = Column(Date, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_follow_up_status_scheduled", "status", "scheduled_time"),
    )
