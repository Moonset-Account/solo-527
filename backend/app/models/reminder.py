import uuid
import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Enum, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReminderType(str, enum.Enum):
    payment_due = "payment_due"
    refund_pending = "refund_pending"
    writeoff_pending = "writeoff_pending"
    escalation = "escalation"


class ReminderStatus(str, enum.Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    resolved = "resolved"
    escalated = "escalated"


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ar_record_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("ar_records.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_to: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ReminderStatus.pending.value)
    due_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    escalated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    escalated_to: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    ar_record: Mapped["ARRecord | None"] = relationship(back_populates="reminders")
