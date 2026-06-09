from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    LEGAL_ASSISTANT = "legal_assistant"
    REVIEWER = "reviewer"
    ANNOTATOR = "annotator"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    full_name = Column(String(128))
    hashed_password = Column(String(255))
    role = Column(SAEnum(UserRole), default=UserRole.LEGAL_ASSISTANT, nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.creator_id")
    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assignee_id")
    feedbacks = relationship("Feedback", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    labels = relationship("SampleLabel", back_populates="annotator")
    approvals = relationship("ApprovalRecord", back_populates="approver")
