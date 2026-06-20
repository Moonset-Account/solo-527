from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Arrear(Base):
    __tablename__ = "arrears"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    bill_id: Mapped[str] = mapped_column(String(36), nullable=True)
    amount: Mapped[float] = mapped_column(default=0)
    overdue_days: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="unpaid")
    handler: Mapped[str] = mapped_column(String(128), nullable=True)
    handle_result: Mapped[str] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class HealthStat(Base):
    __tablename__ = "health_stats"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, default=100)
    arrears_count: Mapped[int] = mapped_column(Integer, default=0)
    anomaly_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_percent: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
