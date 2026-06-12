import enum
from datetime import datetime
from sqlalchemy import String, Enum, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    security_officer = "security_officer"
    operator = "operator"
    requester = "requester"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.requester, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    work_orders: Mapped[list["WorkOrder"]] = relationship("WorkOrder", back_populates="creator", foreign_keys="WorkOrder.creator_id")
    assigned_orders: Mapped[list["WorkOrder"]] = relationship("WorkOrder", back_populates="assignee", foreign_keys="WorkOrder.assignee_id")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")
