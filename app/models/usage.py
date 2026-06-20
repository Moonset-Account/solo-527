from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApiUsage(Base):
    __tablename__ = "api_usages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    api_path: Mapped[str] = mapped_column(String(256), nullable=False)
    method: Mapped[str] = mapped_column(String(16), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    call_count: Mapped[int] = mapped_column(BigInteger, default=1)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
