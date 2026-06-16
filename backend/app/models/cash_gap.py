import uuid
import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, Enum, Numeric, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GapStatus(str, enum.Enum):
    safe = "safe"
    warning = "warning"
    critical = "critical"


class CashGapForecast(Base):
    __tablename__ = "cash_gap_forecasts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    expected_inflow: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    expected_outflow: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    gap_amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    gap_status: Mapped[str] = mapped_column(String(20), nullable=False)
    responsible_person: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
