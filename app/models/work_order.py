import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Text, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class OrderTypeEnum(str, enum.Enum):
    fault = "fault"
    account_request = "account_request"


class OrderStatusEnum(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    rejected = "rejected"


class PriorityEnum(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    order_type: Mapped[OrderTypeEnum] = mapped_column(Enum(OrderTypeEnum), nullable=False)
    status: Mapped[OrderStatusEnum] = mapped_column(Enum(OrderStatusEnum), default=OrderStatusEnum.pending, nullable=False)
    priority: Mapped[PriorityEnum] = mapped_column(Enum(PriorityEnum), default=PriorityEnum.medium, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    creator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    sla_hours: Mapped[float] = mapped_column(Float, default=24.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator: Mapped["User"] = relationship("User", back_populates="work_orders", foreign_keys=[creator_id])
    assignee: Mapped["User | None"] = relationship("User", back_populates="assigned_orders", foreign_keys=[assignee_id])
    records: Mapped[list["ProcessingRecord"]] = relationship("ProcessingRecord", back_populates="work_order", cascade="all, delete-orphan")

    @property
    def is_overdue(self) -> bool:
        if self.status in (OrderStatusEnum.resolved, OrderStatusEnum.closed, OrderStatusEnum.rejected):
            return False
        from datetime import timedelta
        return datetime.utcnow() > self.created_at + timedelta(hours=self.sla_hours)

    @property
    def remaining_hours(self) -> float:
        if self.status in (OrderStatusEnum.resolved, OrderStatusEnum.closed, OrderStatusEnum.rejected):
            return 0.0
        from datetime import timedelta
        elapsed = (datetime.utcnow() - self.created_at).total_seconds() / 3600
        return max(0.0, self.sla_hours - elapsed)


class ProcessingRecord(Base):
    __tablename__ = "processing_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    work_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_orders.id"), nullable=False)
    handler_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="records")
    handler: Mapped["User"] = relationship("User")
