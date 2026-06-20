from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)
    reminder_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    trigger_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ReminderVersion(Base):
    __tablename__ = "reminder_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    reminder_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=True)
    reminder_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    trigger_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    operated_by: Mapped[str] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
