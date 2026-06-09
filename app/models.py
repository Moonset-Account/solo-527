from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class FeedbackCategory(str, enum.Enum):
    STRUCTURE = "structure"
    EVIDENCE = "evidence"
    TYPO = "typo"
    EXPRESSION = "expression"


class AuditStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    NEEDS_REVISION = "needs_revision"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    real_name_encrypted = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student_essays = relationship("Essay", foreign_keys="Essay.student_id", back_populates="student")
    teacher_reviews = relationship("TeacherReview", back_populates="teacher")


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(64), nullable=False)
    grade = Column(String(32), nullable=False)
    head_teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    students = relationship("User", foreign_keys="User.class_id", backref="class_info")
    essays = relationship("Essay", back_populates="class_info")


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_code = Column(String(32), unique=True, nullable=False)
    category = Column(Enum(FeedbackCategory), nullable=False)
    prompt_content = Column(Text, nullable=False)
    description = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Essay(Base):
    __tablename__ = "essays"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_masked = Column(Text, nullable=False)
    content_original_encrypted = Column(Text, nullable=True)
    word_count = Column(Integer, default=0)
    topic_tag = Column(String(128), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", foreign_keys=[student_id], back_populates="student_essays")
    class_info = relationship("Class", back_populates="essays")
    feedbacks = relationship("EssayFeedback", back_populates="essay")
    teacher_review = relationship("TeacherReview", back_populates="essay", uselist=False)


class EssayFeedback(Base):
    __tablename__ = "essay_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    essay_id = Column(Integer, ForeignKey("essays.id"), nullable=False)
    category = Column(Enum(FeedbackCategory), nullable=False)
    prompt_version_id = Column(Integer, ForeignKey("prompt_versions.id"), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    model_name = Column(String(128), nullable=False)
    overall_confidence = Column(Float, nullable=False)
    is_low_confidence = Column(Boolean, default=False)

    essay = relationship("Essay", back_populates="feedbacks")
    prompt_version = relationship("PromptVersion")
    items = relationship("FeedbackItem", back_populates="feedback", cascade="all, delete-orphan")
    evidence_refs = relationship("ModelEvidence", back_populates="feedback", cascade="all, delete-orphan")


class FeedbackItem(Base):
    __tablename__ = "feedback_items"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("essay_feedbacks.id"), nullable=False)
    category = Column(Enum(FeedbackCategory), nullable=False)
    original_text = Column(String(512), nullable=True)
    suggestion_text = Column(Text, nullable=False)
    location_start = Column(Integer, nullable=True)
    location_end = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=False)
    is_low_confidence = Column(Boolean, default=False)
    severity = Column(String(16), default="normal")
    audit_status = Column(Enum(AuditStatus), default=AuditStatus.PENDING)
    audit_note = Column(String(512), nullable=True)
    audited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    audited_at = Column(DateTime(timezone=True), nullable=True)
    revised_suggestion = Column(Text, nullable=True)

    feedback = relationship("EssayFeedback", back_populates="items")
    auditor = relationship("User", foreign_keys=[audited_by])


class ModelEvidence(Base):
    __tablename__ = "model_evidences"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("essay_feedbacks.id"), nullable=False)
    evidence_type = Column(String(64), nullable=False)
    evidence_data = Column(JSON, nullable=False)
    description = Column(String(512), nullable=True)

    feedback = relationship("EssayFeedback", back_populates="evidence_refs")


class TeacherReview(Base):
    __tablename__ = "teacher_reviews"

    id = Column(Integer, primary_key=True, index=True)
    essay_id = Column(Integer, ForeignKey("essays.id"), nullable=False, unique=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    final_score = Column(Float, nullable=True)
    overall_comment_masked = Column(Text, nullable=True)
    overall_comment_encrypted = Column(Text, nullable=True)
    structure_rating = Column(Integer, nullable=True)
    evidence_rating = Column(Integer, nullable=True)
    expression_rating = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    essay = relationship("Essay", back_populates="teacher_review")
    teacher = relationship("User", back_populates="teacher_reviews")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(64), nullable=False)
    target_type = Column(String(64), nullable=False)
    target_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    detail = Column(JSON, nullable=True)
