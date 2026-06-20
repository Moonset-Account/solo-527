from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    contact_email: Mapped[str] = mapped_column(String(256), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=True)
    plan_id: Mapped[str] = mapped_column(String(36), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    health_score: Mapped[int] = mapped_column(default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    feature_flags: Mapped[list["FeatureFlag"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    invoices: Mapped[list["InvoiceHeader"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False)
    flag_key: Mapped[str] = mapped_column(String(128), nullable=False)
    flag_name: Mapped[str] = mapped_column(String(256), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tenant: Mapped["Tenant"] = relationship(back_populates="feature_flags")
