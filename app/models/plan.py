from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    call_limit: Mapped[int] = mapped_column(Integer, default=0)
    rate_limit: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class PlanRule(Base):
    __tablename__ = "plan_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    plan_id: Mapped[str] = mapped_column(String(36), nullable=False)
    rule_key: Mapped[str] = mapped_column(String(128), nullable=False)
    rule_name: Mapped[str] = mapped_column(String(256), nullable=False)
    rule_value: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
