from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum,
    Text, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class QuestionBankStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class QuestionBank(Base):
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    version_code = Column(String(50), unique=True, index=True, nullable=False)
    version_name = Column(String(100), nullable=False)
    major = Column(String(50), index=True)
    subject = Column(String(50), index=True)
    description = Column(Text)
    status = Column(Enum(QuestionBankStatus), default=QuestionBankStatus.DRAFT, index=True)
    total_questions = Column(Integer, default=0)
    total_score = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=120)
    passing_score = Column(Integer, default=60)
    created_by = Column(Integer, ForeignKey("users.id"))
    published_by = Column(Integer, ForeignKey("users.id"))
    published_at = Column(DateTime)
    file_path = Column(String(255))
    tags = Column(JSON)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255))
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    category = Column(String(50))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Remark(Base):
    __tablename__ = "remarks"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_private = Column(Boolean, default=False)
    tags = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HistoryRecord(Base):
    __tablename__ = "history_records"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    change_summary = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ip_address = Column(String(50))
    extra_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    operator = relationship("User", back_populates="history_records")
