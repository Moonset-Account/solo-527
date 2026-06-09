from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.data.database import Base


class DataSourceType(str, enum.Enum):
    CODE_REPO = "code_repo"
    API_DOC = "api_doc"
    COMMIT_LOG = "commit_log"
    TEST_SPEC = "test_spec"
    ARCH_NOTE = "arch_note"


class DocumentStatus(str, enum.Enum):
    RAW = "raw"
    CLEANED = "cleaned"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    INDEXED = "indexed"
    ERROR = "error"


class ReviewAction(str, enum.Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGE = "request_change"


class ConfidenceLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FeedbackType(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    CORRECTION = "correction"


class ModelStatus(str, enum.Enum):
    TRAINING = "training"
    READY = "ready"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(Enum(DataSourceType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String(64), nullable=False, default="v1")
    is_active = Column(Boolean, default=True)
    connection_config = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(128), nullable=True)

    documents = relationship("Document", back_populates="data_source", cascade="all, delete-orphan")
    versions = relationship("DatasetVersion", back_populates="data_source", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=True)
    source_url = Column(String(1024), nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    content_hash = Column(String(128), nullable=False, index=True)
    language = Column(String(64), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.RAW, index=True)
    data_version = Column(String(64), nullable=True)
    cleaning_score = Column(Float, nullable=True)
    cleaning_notes = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    data_source = relationship("DataSource", back_populates="documents")
    reviews = relationship("DocumentReview", back_populates="document", cascade="all, delete-orphan")
    index_records = relationship("IndexRecord", back_populates="document", cascade="all, delete-orphan")


class DocumentReview(Base):
    __tablename__ = "document_reviews"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    reviewer = Column(String(128), nullable=False)
    action = Column(Enum(ReviewAction), nullable=False)
    comment = Column(Text, nullable=True)
    quality_score = Column(Float, nullable=True)
    issues_detected = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    document = relationship("Document", back_populates="reviews")


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False, index=True)
    version_tag = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    document_count = Column(Integer, default=0)
    checksum = Column(String(256), nullable=True)
    storage_path = Column(String(1024), nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    data_source = relationship("DataSource", back_populates="versions")
    index_jobs = relationship("IndexJob", back_populates="dataset_version")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(64), nullable=False, unique=True, index=True)
    model_name = Column(String(255), nullable=False)
    embedding_model = Column(String(255), nullable=True)
    llm_model = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ModelStatus), nullable=False, default=ModelStatus.READY, index=True)
    metrics = Column(JSON, nullable=True)
    training_config = Column(JSON, nullable=True)
    storage_path = Column(String(1024), nullable=True)
    dataset_version_id = Column(Integer, ForeignKey("dataset_versions.id"), nullable=True)
    is_default = Column(Boolean, default=False)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)


class IndexJob(Base):
    __tablename__ = "index_jobs"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False, index=True)
    dataset_version_id = Column(Integer, ForeignKey("dataset_versions.id"), nullable=False, index=True)
    status = Column(String(64), nullable=False, default="pending", index=True)
    document_count = Column(Integer, default=0)
    indexed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    config = Column(JSON, nullable=True)

    dataset_version = relationship("DatasetVersion", back_populates="index_jobs")


class IndexRecord(Base):
    __tablename__ = "index_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    node_id = Column(String(255), nullable=False, unique=True, index=True)
    index_version = Column(String(64), nullable=False)
    chunk_index = Column(Integer, default=0)
    chunk_size = Column(Integer, default=0)
    embedding_status = Column(String(32), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="index_records")


class QAConversation(Base):
    __tablename__ = "qa_conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    user_id = Column(String(128), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    model_version = Column(String(64), nullable=True)
    confidence_score = Column(Float, nullable=True)
    confidence_level = Column(Enum(ConfidenceLevel), nullable=True)
    sources_used = Column(JSON, nullable=True)
    reasoning = Column(Text, nullable=True)
    low_confidence_warning = Column(Boolean, default=False)
    requires_human_review = Column(Boolean, default=False)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    feedbacks = relationship("QAFeedback", back_populates="conversation", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="conversation", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("qa_conversations.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    node_id = Column(String(255), nullable=True)
    source_title = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=True)
    source_url = Column(String(1024), nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    snippet = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("QAConversation", back_populates="citations")


class QAFeedback(Base):
    __tablename__ = "qa_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("qa_conversations.id"), nullable=False, index=True)
    feedback_type = Column(Enum(FeedbackType), nullable=False, index=True)
    user_id = Column(String(128), nullable=True)
    comment = Column(Text, nullable=True)
    corrected_answer = Column(Text, nullable=True)
    is_error_sample = Column(Boolean, default=False, index=True)
    error_category = Column(String(128), nullable=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(String(128), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    conversation = relationship("QAConversation", back_populates="feedbacks")


class ErrorSample(Base):
    __tablename__ = "error_samples"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    incorrect_answer = Column(Text, nullable=True)
    expected_answer = Column(Text, nullable=True)
    error_category = Column(String(128), nullable=True, index=True)
    source_feedback_id = Column(Integer, ForeignKey("qa_feedbacks.id"), nullable=True)
    model_version = Column(String(64), nullable=True)
    dataset_version = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    labels = Column(JSON, nullable=True)
    severity = Column(String(32), default="medium", index=True)
    status = Column(String(32), default="open", index=True)
    assigned_to = Column(String(128), nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    actor = Column(String(128), nullable=True, index=True)
    action = Column(String(128), nullable=False, index=True)
    resource_type = Column(String(64), nullable=True)
    resource_id = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    request_id = Column(String(255), nullable=True, index=True)
    response_status = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)


class ApiCallLog(Base):
    __tablename__ = "api_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(255), nullable=False, unique=True, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(16), nullable=False)
    user_id = Column(String(128), nullable=True, index=True)
    model_version = Column(String(64), nullable=True, index=True)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=True)
    rate_limited = Column(Boolean, default=False)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
