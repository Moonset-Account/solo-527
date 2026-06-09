from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    ForeignKey, Float, JSON, Enum as SAEnum, BigInteger, Index
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class TaskType(str, enum.Enum):
    PARSE_DOCUMENT = "parse_document"
    CLEAN_DATA = "clean_data"
    GENERATE_SUMMARY = "generate_summary"
    DETECT_RISKS = "detect_risks"
    DIFF_COMPARE = "diff_compare"
    QA_ANSWER = "qa_answer"
    BUILD_VECTOR_INDEX = "build_vector_index"
    EVALUATE_MODEL = "evaluate_model"
    DATASET_BUILD = "dataset_build"
    EXPORT_REPORT = "export_report"
    TRAIN_MODEL = "train_model"
    NOTIFY_ALERT = "notify_alert"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"
    RETRYING = "retrying"
    TIMEOUT = "timeout"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FeedbackType(str, enum.Enum):
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"
    CORRECTION = "correction"
    COMMENT = "comment"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertType(str, enum.Enum):
    TASK_FAILED = "task_failed"
    MODEL_DEGRADATION = "model_degradation"
    HIGH_ERROR_RATE = "high_error_rate"
    HIGH_LATENCY = "high_latency"
    DATA_QUALITY = "data_quality"
    SYSTEM_ERROR = "system_error"
    SECURITY = "security"
    NEW_ERROR_SAMPLE = "new_error_sample"
    REVIEW_NEEDED = "review_needed"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    REVIEW = "review"
    ROLLBACK = "rollback"
    EXPORT = "export"
    LOGIN = "login"
    LOGOUT = "logout"
    PUBLISH = "publish"
    LABEL = "label"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(SAEnum(TaskType), nullable=False, index=True)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    priority = Column(SAEnum(TaskPriority), default=TaskPriority.MEDIUM, index=True)

    celery_task_id = Column(String(128), nullable=True, index=True)
    task_queue = Column(String(64), nullable=True)

    contract_id = Column(Integer, ForeignKey("contract_documents.id"), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    model_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    ab_run_id = Column(Integer, ForeignKey("ab_runs.id"), nullable=True)

    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    title = Column(String(512), nullable=True)
    params = Column(JSON, nullable=True)
    config = Column(JSON, nullable=True)

    progress_percent = Column(Float, default=0.0)
    progress_message = Column(String(512), nullable=True)
    progress_detail = Column(JSON, nullable=True)

    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=3600)

    queued_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)

    total_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)

    tags = Column(JSON, nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User", back_populates="created_tasks", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])
    results = relationship("TaskResult", back_populates="task", cascade="all, delete-orphan")


class TaskResult(Base):
    __tablename__ = "task_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    result_key = Column(String(128), default="default")
    result_type = Column(String(64), nullable=True)
    result_data = Column(JSON, nullable=True)
    result_text = Column(Text, nullable=True)
    result_file_path = Column(String(1024), nullable=True)

    metrics = Column(JSON, nullable=True)
    model_version = Column(String(64), nullable=True)
    prompt_version = Column(String(64), nullable=True)
    latency_ms = Column(Float, nullable=True)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    task = relationship("Task", back_populates="results")
    feedbacks = relationship("Feedback", back_populates="task_result")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    task_result_id = Column(Integer, ForeignKey("task_results.id", ondelete="CASCADE"), nullable=True, index=True)
    risk_id = Column(Integer, ForeignKey("risk_alerts.id", ondelete="CASCADE"), nullable=True, index=True)
    summary_id = Column(Integer, ForeignKey("contract_summaries.id"), nullable=True)

    feedback_type = Column(SAEnum(FeedbackType), default=FeedbackType.COMMENT, index=True)
    score = Column(Float, nullable=True)
    content = Column(Text, nullable=True)
    corrected_text = Column(Text, nullable=True)

    extra_metadata = Column(JSON, nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    escalated = Column(Boolean, default=False)
    escalated_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalation_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="feedbacks")
    task_result = relationship("TaskResult", back_populates="feedbacks")
    risk = relationship("RiskAlert", back_populates="feedbacks")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    action = Column(SAEnum(AuditAction), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(128), nullable=True, index=True)

    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    changes = Column(JSON, nullable=True)

    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    session_id = Column(String(128), nullable=True)

    note = Column(Text, nullable=True)
    extra_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_resource", "resource_type", "resource_id"),
        Index("ix_audit_user_action", "user_id", "action", "created_at"),
    )


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(SAEnum(AlertType), nullable=False, index=True)
    severity = Column(SAEnum(AlertSeverity), default=AlertSeverity.WARNING, index=True)

    title = Column(String(512), nullable=False)
    message = Column(Text, nullable=False)

    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    model_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    error_sample_id = Column(Integer, ForeignKey("error_samples.id"), nullable=True)
    triggered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    related_ids = Column(JSON, nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    metrics_snapshot = Column(JSON, nullable=True)

    channels_notified = Column(JSON, nullable=True)
    status = Column(String(32), default="active", index=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    ack_note = Column(Text, nullable=True)

    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
