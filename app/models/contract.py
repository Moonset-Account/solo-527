from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text,
    ForeignKey, Float, JSON, Enum as SAEnum, BigInteger
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class ContractType(str, enum.Enum):
    PURCHASE = "purchase"
    SALES = "sales"
    SERVICE = "service"
    NDA = "nda"
    LABOR = "labor"
    COOPERATION = "cooperation"
    LEASE = "lease"
    LOAN = "loan"
    OTHER = "other"


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    PARSING = "parsing"
    PARSED = "parsed"
    ANALYZING = "analyzing"
    ANALYZED = "analyzed"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"
    ERROR = "error"


class ClauseCategory(str, enum.Enum):
    PARTIES = "parties"
    DEFINITIONS = "definitions"
    OBJECT = "object"
    PRICE_PAYMENT = "price_payment"
    DELIVERY = "delivery"
    QUALITY = "quality"
    TERM = "term"
    TERMINATION = "termination"
    CONFIDENTIALITY = "confidentiality"
    IP = "ip"
    LIABILITY = "liability"
    INDEMNIFICATION = "indemnification"
    WARRANTY = "warranty"
    DISPUTE = "dispute"
    GOVERNING_LAW = "governing_law"
    FORCE_MAJEURE = "force_majeure"
    MISCELLANEOUS = "miscellaneous"
    SIGNATURE = "signature"
    OTHER = "other"


class RiskLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class RiskType(str, enum.Enum):
    UNCLEAR_LIABILITY = "unclear_liability"
    EXCESSIVE_PENALTY = "excessive_penalty"
    UNFAVORABLE_TERMINATION = "unfavorable_termination"
    IP_TRANSFER_RISK = "ip_transfer_risk"
    MISSING_KEY_CLAUSE = "missing_key_clause"
    AMBIGUOUS_LANGUAGE = "ambiguous_language"
    NON_COMPLIANCE = "non_compliance"
    DEADLINE_RISK = "deadline_risk"
    PAYMENT_RISK = "payment_risk"
    WARRANTY_RISK = "warranty_risk"
    OTHER = "other"


class RevisionType(str, enum.Enum):
    AI_SUGGESTION = "ai_suggestion"
    MANUAL_EDIT = "manual_edit"
    TEMPLATE_APPLY = "template_apply"
    EXTERNAL = "external"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DELEGATED = "delegated"


class ContractDocument(Base):
    __tablename__ = "contract_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False, index=True)
    contract_no = Column(String(128), index=True)
    contract_type = Column(SAEnum(ContractType), default=ContractType.OTHER, index=True)
    status = Column(SAEnum(ContractStatus), default=ContractStatus.DRAFT, index=True)

    file_name = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_size = Column(BigInteger, default=0)
    file_hash = Column(String(128), index=True)
    mime_type = Column(String(64))

    party_a = Column(String(256))
    party_b = Column(String(256))
    sign_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    total_amount = Column(Float, nullable=True)
    currency = Column(String(16), default="CNY")

    page_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    clause_count = Column(Integer, default=0)

    template_id = Column(Integer, ForeignKey("contract_templates.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("contract_documents.id"), nullable=True)

    model_version = Column(String(64), nullable=True)
    parse_config = Column(JSON, nullable=True)
    raw_metadata = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    analyzed_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)

    clauses = relationship("ContractClause", back_populates="document", cascade="all, delete-orphan")
    summaries = relationship("ContractSummary", back_populates="document", cascade="all, delete-orphan")
    risks = relationship("RiskAlert", back_populates="document", cascade="all, delete-orphan")
    revisions = relationship("RevisionRecord", back_populates="document", cascade="all, delete-orphan")
    approvals = relationship("ApprovalRecord", back_populates="document", cascade="all, delete-orphan")
    template = relationship("ContractTemplate", back_populates="contracts")
    parent = relationship("ContractDocument", remote_side=[id])


class ContractClause(Base):
    __tablename__ = "contract_clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("contract_documents.id", ondelete="CASCADE"), nullable=False, index=True)

    clause_index = Column(Integer, nullable=False)
    clause_title = Column(String(256), nullable=True)
    clause_number = Column(String(64), nullable=True)
    category = Column(SAEnum(ClauseCategory), default=ClauseCategory.OTHER, index=True)

    original_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)

    page_start = Column(Integer, default=1)
    page_end = Column(Integer, default=1)
    char_start = Column(Integer, default=0)
    char_end = Column(Integer, default=0)
    position_hint = Column(String(256), nullable=True)

    is_complete = Column(Boolean, default=True)
    quality_score = Column(Float, default=1.0, index=True)
    ai_category_confidence = Column(Float, nullable=True)
    category_verified = Column(Boolean, default=False)

    embedding_status = Column(String(32), default="pending")
    embedding_id = Column(String(128), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("ContractDocument", back_populates="clauses")
    risks = relationship("RiskAlert", back_populates="clause")
    labels = relationship("SampleLabel", back_populates="clause")


class ContractSummary(Base):
    __tablename__ = "contract_summaries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("contract_documents.id", ondelete="CASCADE"), nullable=False, index=True)

    summary_type = Column(String(64), default="full", index=True)
    summary_text = Column(Text, nullable=False)
    key_points = Column(JSON, nullable=True)
    key_parties = Column(JSON, nullable=True)
    key_dates = Column(JSON, nullable=True)
    key_amounts = Column(JSON, nullable=True)
    key_obligations = Column(JSON, nullable=True)

    model_version = Column(String(64), nullable=True)
    prompt_version = Column(String(64), nullable=True)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=True)
    quality_score = Column(Float, nullable=True)

    human_revised = Column(Boolean, default=False)
    revised_text = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("ContractDocument", back_populates="summaries")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("contract_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("contract_clauses.id", ondelete="CASCADE"), nullable=True, index=True)

    risk_type = Column(SAEnum(RiskType), default=RiskType.OTHER, index=True)
    risk_level = Column(SAEnum(RiskLevel), default=RiskLevel.LOW, index=True)
    risk_score = Column(Float, default=0.0, index=True)

    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)
    rule_id = Column(String(128), nullable=True)

    source_paragraph = Column(Text, nullable=False)
    source_clause_ref = Column(String(128), nullable=True)
    source_char_start = Column(Integer, nullable=True)
    source_char_end = Column(Integer, nullable=True)
    source_page = Column(Integer, nullable=True)

    model_version = Column(String(64), nullable=True)
    detection_method = Column(String(64), default="rule_llm_hybrid")
    confidence = Column(Float, default=1.0)

    status = Column(String(32), default="pending", index=True)
    false_positive = Column(Boolean, default=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("ContractDocument", back_populates="risks")
    clause = relationship("ContractClause", back_populates="risks")
    feedbacks = relationship("Feedback", back_populates="risk")


class ContractTemplate(Base):
    __tablename__ = "contract_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False, index=True)
    template_type = Column(SAEnum(ContractType), default=ContractType.OTHER, index=True)
    version = Column(String(64), default="1.0")
    is_active = Column(Boolean, default=True, index=True)

    file_name = Column(String(512))
    file_path = Column(String(1024))
    content_text = Column(Text, nullable=True)
    clause_structure = Column(JSON, nullable=True)
    standard_clauses = Column(JSON, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contracts = relationship("ContractDocument", back_populates="template")


class RevisionRecord(Base):
    __tablename__ = "revision_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("contract_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("contract_clauses.id"), nullable=True)

    revision_type = Column(SAEnum(RevisionType), default=RevisionType.MANUAL_EDIT, index=True)
    revision_no = Column(Integer, default=1)

    original_text = Column(Text, nullable=True)
    revised_text = Column(Text, nullable=False)
    diff_data = Column(JSON, nullable=True)
    change_summary = Column(Text, nullable=True)

    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    comment = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    accepted = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    document = relationship("ContractDocument", back_populates="revisions")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("contract_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    approval_step = Column(Integer, default=1)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.PENDING, index=True)
    comment = Column(Text, nullable=True)

    approved_at = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)
    delegated_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("ContractDocument", back_populates="approvals")
    approver = relationship("User", back_populates="approvals", foreign_keys=[approver_id])
