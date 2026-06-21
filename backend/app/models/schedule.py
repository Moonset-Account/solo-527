from sqlalchemy import Column, String, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Schedule(BaseModel):
    __tablename__ = "schedules"

    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    shift_type = Column(String(20), nullable=False)
    work_load = Column(Integer, nullable=False, default=0)
    foster_risk_reasons = Column(String(500), nullable=True)
    risk_level = Column(String(20), nullable=False, default="low")

    __table_args__ = (
        UniqueConstraint("staff_id", "date", name="uq_schedule_staff_date"),
    )
