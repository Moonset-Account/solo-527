from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    anomaly_type: Mapped[str] = mapped_column(String(64), nullable=False)
    api_path: Mapped[str] = mapped_column(String(256), nullable=True)
    detail: Mapped[str] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(16), default="warning")
    status: Mapped[str] = mapped_column(String(32), default="open")
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
