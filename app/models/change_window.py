import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Text, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WindowStatusEnum(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ChangeWindow(Base):
    __tablename__ = "change_windows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WindowStatusEnum] = mapped_column(Enum(WindowStatusEnum), default=WindowStatusEnum.planned, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_risky: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    responsible_person: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
