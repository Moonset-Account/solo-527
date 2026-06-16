import uuid
import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, Enum, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ARStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"
    overdue = "overdue"


class ARRecord(Base):
    __tablename__ = "ar_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="CNY")
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ARStatus.pending.value)
    responsible_person: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments: Mapped[list["Payment"]] = relationship(back_populates="ar_record", cascade="all, delete-orphan")
    refunds: Mapped[list["Refund"]] = relationship(back_populates="ar_record", cascade="all, delete-orphan")
    writeoffs: Mapped[list["Writeoff"]] = relationship(back_populates="ar_record", cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="ar_record", cascade="all, delete-orphan")
