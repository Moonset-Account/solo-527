import uuid
import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, Enum, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PaymentMethod(str, enum.Enum):
    bank_transfer = "bank_transfer"
    credit_card = "credit_card"
    other = "other"


class PaymentStatus(str, enum.Enum):
    confirmed = "confirmed"
    pending = "pending"
    failed = "failed"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ar_record_id: Mapped[str] = mapped_column(String(36), ForeignKey("ar_records.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=PaymentStatus.pending.value)
    operator: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    ar_record: Mapped["ARRecord"] = relationship(back_populates="payments")
