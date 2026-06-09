from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    ForeignKey, Float, JSON, Enum as SAEnum, BigInteger, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class DatasetType(str, enum.Enum):
    TRAIN = "train"
    VALIDATION = "validation"
    TEST = "test"
    GOLDEN = "golden"
    ERROR_CASES = "error_cases"
    A_B_TEST = "a_b_test"


class SampleStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"
    ARCHIVED = "archived"


class SampleType(str, enum.Enum):
    CLAUSE_SUMMARY = "clause_summary"
    RISK_DETECTION = "risk_detection"
    RISK_CLASSIFICATION = "risk_classification"
    CLAUSE_CATEGORY = "clause_category"
    DOCUMENT_SUMMARY = "document_summary"
    QA_PAIR = "qa_pair"
    TRANSLATION = "translation"


class ErrorSeverity(str, enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    COSMETIC = "cosmetic"


class ErrorType(str, enum.Enum):
    HALLUCINATION = "hallucination"
    MISSING_INFORMATION = "missing_information"
    WRONG_CLASSIFICATION = "wrong_classification"
    FALSE_POSITIVE = "false_positive"
    FALSE_NEGATIVE = "false_negative"
    MISATTRIBUTION = "misattribution"
    INCORRECT_SUMMARY = "incorrect_summary"
    POOR_QUALITY = "poor_quality"
    OTHER = "other"


class LabelType(str, enum.Enum):
    CATEGORY = "category"
    RISK_LEVEL = "risk_level"
    RISK_TYPE = "risk_type"
    SUMMARY = "summary"
    KEYPOINT = "keypoint"
    QA_ANSWER = "qa_answer"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False, index=True)
    description = Column(Text, nullable=True)
    dataset_type = Column(SAEnum(DatasetType), default=DatasetType.TRAIN, index=True)
    version = Column(String(64), default="1.0", index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    is_public = Column(Boolean, default=False)

    tags = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    stats = Column(JSON, nullable=True)

    sample_count = Column(Integer, default=0)
    approved_count = Column(Integer, default=0)
    labeled_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    samples = relationship("DatasetSample", back_populates="dataset", cascade="all, delete-orphan")
    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(64), nullable=False, index=True)

    change_log = Column(Text, nullable=True)
    sample_count = Column(Integer, default=0)
    stats_snapshot = Column(JSON, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("dataset_id", "version", name="uq_dataset_version"),
    )


class DatasetSample(Base):
    __tablename__ = "dataset_samples"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)

    sample_type = Column(SAEnum(SampleType), default=SampleType.CLAUSE_SUMMARY, index=True)
    status = Column(SAEnum(SampleStatus), default=SampleStatus.DRAFT, index=True)

    source_contract_id = Column(Integer, ForeignKey("contract_documents.id"), nullable=True)
    source_clause_id = Column(Integer, ForeignKey("contract_clauses.id"), nullable=True)
    source_risk_id = Column(Integer, ForeignKey("risk_alerts.id"), nullable=True)
    source_task_result_id = Column(Integer, ForeignKey("task_results.id"), nullable=True)

    input_text = Column(Text, nullable=False)
    reference_output = Column(Text, nullable=True)
    input_metadata = Column(JSON, nullable=True)
    reference_metadata = Column(JSON, nullable=True)
    reference_score = Column(Float, nullable=True)

    difficulty_level = Column(Integer, default=1, index=True)
    quality_score = Column(Float, default=1.0, index=True)
    weight = Column(Float, default=1.0)

    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    previous_sample_id = Column(Integer, ForeignKey("dataset_samples.id"), nullable=True)
    rollback_to_id = Column(Integer, ForeignKey("dataset_samples.id"), nullable=True)
    is_rollback = Column(Boolean, default=False)
    rollback_reason = Column(Text, nullable=True)
    rolled_back_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)

    dataset = relationship("Dataset", back_populates="samples")
    clause = relationship("ContractClause", back_populates="labels")
    labels = relationship("SampleLabel", back_populates="sample", cascade="all, delete-orphan")
    error_samples = relationship("ErrorSample", back_populates="sample", cascade="all, delete-orphan")
    previous = relationship("DatasetSample", foreign_keys=[previous_sample_id], remote_side=[id])
    rollback_to = relationship("DatasetSample", foreign_keys=[rollback_to_id], remote_side=[id])


class SampleLabel(Base):
    __tablename__ = "sample_labels"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("dataset_samples.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("contract_clauses.id"), nullable=True)

    label_type = Column(SAEnum(LabelType), nullable=False, index=True)
    label_value = Column(Text, nullable=False)
    label_confidence = Column(Float, default=1.0)
    label_metadata = Column(JSON, nullable=True)

    annotator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_gold_label = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sample = relationship("DatasetSample", back_populates="labels")
    clause = relationship("ContractClause", back_populates="labels")
    annotator = relationship("User", back_populates="labels")


class ErrorSample(Base):
    __tablename__ = "error_samples"

    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("dataset_samples.id", ondelete="CASCADE"), nullable=True, index=True)
    source_task_result_id = Column(Integer, ForeignKey("task_results.id"), nullable=True, index=True)

    error_type = Column(SAEnum(ErrorType), default=ErrorType.OTHER, index=True)
    severity = Column(SAEnum(ErrorSeverity), default=ErrorSeverity.MINOR, index=True)

    model_output = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=True)
    input_context = Column(Text, nullable=True)
    error_description = Column(Text, nullable=True)
    reproduction_steps = Column(Text, nullable=True)

    model_version = Column(String(64), nullable=True, index=True)
    prompt_version = Column(String(64), nullable=True)
    run_id = Column(String(128), nullable=True)

    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String(32), default="open", index=True)
    triaged = Column(Boolean, default=False)
    reproducible = Column(Boolean, default=True)
    false_alarm = Column(Boolean, default=False)

    fix_suggestion = Column(Text, nullable=True)
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    tags = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sample = relationship("DatasetSample", back_populates="error_samples")
    evaluations = relationship("EvaluationResult", back_populates="error_sample")
