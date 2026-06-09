from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    ForeignKey, Float, JSON, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class ModelStatus(str, enum.Enum):
    DRAFT = "draft"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"
    ROLLED_BACK = "rolled_back"


class MetricType(str, enum.Enum):
    ACCURACY = "accuracy"
    PRECISION = "precision"
    RECALL = "recall"
    F1 = "f1"
    ROGUE = "rouge"
    BLEU = "bleu"
    BERT_SCORE = "bert_score"
    LATENCY = "latency"
    THROUGHPUT = "throughput"
    COST = "cost"
    ERROR_RATE = "error_rate"
    HALLUCINATION_RATE = "hallucination_rate"
    USER_SATISFACTION = "user_satisfaction"


class TaskType(str, enum.Enum):
    SUMMARY = "summary"
    RISK_DETECTION = "risk_detection"
    RISK_CLASSIFICATION = "risk_classification"
    CLAUSE_CATEGORY = "clause_category"
    QA = "qa"
    TRANSLATION = "translation"


class ABStatus(str, enum.Enum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    STOPPED = "stopped"
    ANALYZED = "analyzed"


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(128), nullable=False, index=True)
    version = Column(String(64), nullable=False, index=True)
    task_type = Column(SAEnum(TaskType), index=True)

    status = Column(SAEnum(ModelStatus), default=ModelStatus.DRAFT, index=True)
    is_default = Column(Boolean, default=False)

    provider = Column(String(64), default="openai")
    base_model = Column(String(128), nullable=True)
    fine_tuned_on = Column(String(256), nullable=True)
    fine_tune_dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)

    prompt_template_version = Column(String(64), nullable=True)
    system_prompt = Column(Text, nullable=True)
    generation_config = Column(JSON, nullable=True)
    rag_config = Column(JSON, nullable=True)

    training_metrics = Column(JSON, nullable=True)
    eval_metrics = Column(JSON, nullable=True)
    threshold_config = Column(JSON, nullable=True)

    description = Column(Text, nullable=True)
    changelog = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)

    parent_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    rollback_to_version = Column(String(64), nullable=True)
    rolled_back_at = Column(DateTime, nullable=True)
    rollback_reason = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)

    metrics = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")
    ab_runs_a = relationship("ABRun", back_populates="model_a", foreign_keys="ABRun.model_a_id")
    ab_runs_b = relationship("ABRun", back_populates="model_b", foreign_keys="ABRun.model_b_id")
    evaluations = relationship("EvaluationResult", back_populates="model")
    parent = relationship("ModelVersion", remote_side=[id])

    __table_args__ = (
        UniqueConstraint("model_name", "version", name="uq_model_name_version"),
    )


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True)

    metric_type = Column(SAEnum(MetricType), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    metric_ci_lower = Column(Float, nullable=True)
    metric_ci_upper = Column(Float, nullable=True)

    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    dataset_version = Column(String(64), nullable=True)
    sample_size = Column(Integer, nullable=True)

    window_start = Column(DateTime, nullable=True)
    window_end = Column(DateTime, nullable=True)

    metadata = Column(JSON, nullable=True)
    computed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    model = relationship("ModelVersion", back_populates="metrics")


class ABRun(Base):
    __tablename__ = "ab_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False, index=True)
    description = Column(Text, nullable=True)

    model_a_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    model_b_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)

    task_type = Column(SAEnum(TaskType), index=True)
    status = Column(SAEnum(ABStatus), default=ABStatus.DRAFT, index=True)

    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    split_ratio = Column(Float, default=0.5)
    target_sample_size = Column(Integer, default=0)
    actual_sample_size_a = Column(Integer, default=0)
    actual_sample_size_b = Column(Integer, default=0)

    primary_metric = Column(String(64), nullable=True)
    winner = Column(String(64), nullable=True)
    p_value = Column(Float, nullable=True)
    is_statistically_significant = Column(Boolean, default=False)
    results_summary = Column(JSON, nullable=True)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    analyzed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    model_a = relationship("ModelVersion", back_populates="ab_runs_a", foreign_keys=[model_a_id])
    model_b = relationship("ModelVersion", back_populates="ab_runs_b", foreign_keys=[model_b_id])
    evaluations = relationship("EvaluationResult", back_populates="ab_run")


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False, index=True)
    ab_run_id = Column(Integer, ForeignKey("ab_runs.id"), nullable=True, index=True)
    sample_id = Column(Integer, ForeignKey("dataset_samples.id"), nullable=True, index=True)
    error_sample_id = Column(Integer, ForeignKey("error_samples.id"), nullable=True, index=True)

    task_type = Column(SAEnum(TaskType), index=True)
    variant_label = Column(String(32), nullable=True)

    input_text = Column(Text, nullable=True)
    model_output = Column(Text, nullable=False)
    reference_output = Column(Text, nullable=True)

    scores = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    passed = Column(Boolean, default=True)
    is_error_case = Column(Boolean, default=False)

    latency_ms = Column(Float, nullable=True)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)

    human_feedback_score = Column(Float, nullable=True)
    human_preference = Column(String(32), nullable=True)
    judge_model_score = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    model = relationship("ModelVersion", back_populates="evaluations")
    ab_run = relationship("ABRun", back_populates="evaluations")
    error_sample = relationship("ErrorSample", back_populates="evaluations")
