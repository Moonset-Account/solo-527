from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Float,
    Boolean, JSON, Index
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class TicketChannel(PyEnum):
    WEB = "web"
    APP = "app"
    WECHAT = "wechat"
    PHONE = "phone"
    EMAIL = "email"
    OTHER = "other"


class ProcessResult(PyEnum):
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    TRANSFERRED = "transferred"
    PENDING = "pending"
    CLOSED = "closed"


class RefundStatus(PyEnum):
    NONE = "none"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class TicketStatus(PyEnum):
    NEW = "new"
    AUTO_CLASSIFIED = "auto_classified"
    PENDING_REVIEW = "pending_review"
    HUMAN_REVIEWED = "human_reviewed"
    CONFIRMED = "confirmed"
    ERROR_CASE = "error_case"


class ModelStatus(PyEnum):
    DRAFT = "draft"
    TRAINING = "training"
    EVALUATING = "evaluating"
    DEPLOYED = "deployed"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class TaskStatus(PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = relationship("Category", backref="children", remote_side=[id])

    __table_args__ = (Index("ix_category_code", "code", unique=True),)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    channel = Column(String(30), default=TicketChannel.OTHER.value)
    process_result = Column(String(30), nullable=True)
    refund_status = Column(String(30), default=RefundStatus.NONE.value)
    refund_amount = Column(Float, default=0.0)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    predicted_category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(30), default=TicketStatus.NEW.value)

    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    is_error_case = Column(Boolean, default=False)
    error_source_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    category = relationship("Category", foreign_keys=[category_id], backref="tickets")
    predicted_category = relationship("Category", foreign_keys=[predicted_category_id])
    model_version = relationship("ModelVersion", backref="tickets")
    annotations = relationship("AnnotationVersion", backref="ticket", cascade="all, delete-orphan")
    similar_cases = relationship("SimilarCase", backref="ticket", cascade="all, delete-orphan", foreign_keys="SimilarCase.ticket_id")

    __table_args__ = (
        Index("ix_ticket_status_created", "status", "created_at"),
        Index("ix_ticket_category_confidence", "category_id", "confidence"),
    )


class AnnotationVersion(Base):
    __tablename__ = "annotation_versions"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    reason = Column(Text, nullable=False)
    operator_id = Column(Integer, nullable=False)
    operator_name = Column(String(100), nullable=False)
    source = Column(String(50), default="manual")
    change_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    category = relationship("Category")

    __table_args__ = (
        Index("ix_annotation_ticket_version", "ticket_id", "version", unique=True),
    )


class SimilarCase(Base):
    __tablename__ = "similar_cases"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    similar_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    category_match = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    similar_ticket = relationship("Ticket", foreign_keys=[similar_ticket_id])


class ErrorSample(Base):
    __tablename__ = "error_samples"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, unique=True)
    original_predicted_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    correct_category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    source = Column(String(50), default="human_review")
    error_type = Column(String(50), nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    included_in_training = Column(Boolean, default=False)
    training_run_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    reported_by = Column(String(100), nullable=True)

    ticket = relationship("Ticket", foreign_keys=[ticket_id])
    original_category = relationship("Category", foreign_keys=[original_predicted_id])
    correct_category = relationship("Category", foreign_keys=[correct_category_id])
    model_version = relationship("ModelVersion", foreign_keys=[model_version_id])


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, nullable=False)
    model_path = Column(String(500), nullable=False)
    metrics = Column(JSON, nullable=True)
    status = Column(String(30), default=ModelStatus.DRAFT.value)
    training_task_id = Column(Integer, ForeignKey("training_tasks.id"), nullable=True)
    previous_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    is_current = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    training_data_summary = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deployed_at = Column(DateTime, nullable=True)
    rolled_back_at = Column(DateTime, nullable=True)

    previous_version = relationship("ModelVersion", remote_side=[id])
    training_task = relationship("TrainingTask", back_populates="model_version")


class TrainingTask(Base):
    __tablename__ = "training_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    job_id = Column(String(100), nullable=True, unique=True)
    status = Column(String(30), default=TaskStatus.PENDING.value)
    progress = Column(Float, default=0.0)
    status_message = Column(Text, nullable=True)
    config = Column(JSON, nullable=True)
    dataset_info = Column(JSON, nullable=True)
    include_error_samples = Column(Boolean, default=True)
    error_source_filter = Column(JSON, nullable=True)
    error_sample_count = Column(Integer, default=0)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    model_version = relationship("ModelVersion", back_populates="training_task", uselist=False)
    metrics = relationship("TrainingMetric", backref="task", cascade="all, delete-orphan")


class TrainingMetric(Base):
    __tablename__ = "training_metrics"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("training_tasks.id"), nullable=False)
    epoch = Column(Integer, nullable=False)
    split = Column(String(20), default="train")
    loss = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    precision_macro = Column(Float, nullable=True)
    recall_macro = Column(Float, nullable=True)
    f1_macro = Column(Float, nullable=True)
    confusion_matrix = Column(JSON, nullable=True)
    per_class_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BatchConfirmLog(Base):
    __tablename__ = "batch_confirm_logs"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, nullable=False)
    operator_name = Column(String(100), nullable=False)
    ticket_ids = Column(JSON, nullable=False)
    category_updates = Column(JSON, nullable=True)
    total_count = Column(Integer, default=0)
    error_case_count = Column(Integer, default=0)
    stats_updated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class RollbackLog(Base):
    __tablename__ = "rollback_logs"

    id = Column(Integer, primary_key=True, index=True)
    from_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    to_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    reason = Column(Text, nullable=False)
    operator_id = Column(Integer, nullable=False)
    operator_name = Column(String(100), nullable=False)
    rollback_type = Column(String(50), default="model")
    affected_ticket_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    from_version = relationship("ModelVersion", foreign_keys=[from_version_id])
    to_version = relationship("ModelVersion", foreign_keys=[to_version_id])
