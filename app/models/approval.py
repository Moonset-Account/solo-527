from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ApprovalAction(str, enum.Enum):
    APPROVE = "approve"
    REJECT = "reject"
    TRANSFER = "transfer"


class ApprovalLevel(Base):
    __tablename__ = "approval_levels"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    condition = Column(Text)
    is_active = Column(Boolean, default=True)

    approvers = relationship("ApprovalLevelUser", back_populates="level")
    approval_records = relationship("ApprovalRecord", back_populates="level")


class ApprovalLevelUser(Base):
    __tablename__ = "approval_level_users"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("approval_levels.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    __table_args__ = (UniqueConstraint("level_id", "user_id", name="uq_level_user"),)

    level = relationship("ApprovalLevel", back_populates="approvers")
    user = relationship("User")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase_requests.id", ondelete="CASCADE"))
    level_id = Column(Integer, ForeignKey("approval_levels.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    action = Column(Enum(ApprovalAction), nullable=False)
    opinion = Column(Text)
    approved_at = Column(DateTime, server_default=func.now())

    purchase = relationship("PurchaseRequest", back_populates="approval_records")
    level = relationship("ApprovalLevel", back_populates="approval_records")
    approver = relationship("User", foreign_keys=[approver_id])
