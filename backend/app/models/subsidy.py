import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SubsidyRecord(Base):
    __tablename__ = "subsidy_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("meal_orders.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    is_exceed = Column(Boolean, default=False, nullable=False)
    confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_by = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    elder = relationship("Elder", back_populates="subsidy_records")


class SubsidyExceedConfirmation(Base):
    __tablename__ = "subsidy_exceed_confirmations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    subsidy_record_id = Column(UUID(as_uuid=True), ForeignKey("subsidy_records.id", ondelete="SET NULL"), nullable=True)
    confirm_type = Column(String(32), nullable=False)
    confirmer_name = Column(String(64), nullable=True)
    confirmer_phone = Column(String(20), nullable=True)
    status = Column(String(32), default="pending", nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    elder = relationship("Elder")
    subsidy_record = relationship("SubsidyRecord")
