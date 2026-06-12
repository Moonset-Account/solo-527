from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum, Date, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COMPLIANCE_MANAGER = "compliance_manager"
    LAWYER = "lawyer"
    REVIEWER = "reviewer"
    SUBMITTER = "submitter"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(64), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SUBMITTER)
    is_active = Column(Boolean, default=True)
    phone = Column(String(32))
    department = Column(String(128))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    submissions = relationship("ChecklistSubmission", back_populates="submitter", foreign_keys="ChecklistSubmission.submitter_id")
    lawyer_assignments = relationship("Assignment", back_populates="lawyer", foreign_keys="Assignment.lawyer_id")
    reviewer_assignments = relationship("Assignment", back_populates="reviewer", foreign_keys="Assignment.reviewer_id")
    sent_reminders = relationship("Reminder", back_populates="sender", foreign_keys="Reminder.sender_id")
    received_reminders = relationship("Reminder", back_populates="recipient", foreign_keys="Reminder.recipient_id")


class ChecklistStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    LAWYER_REVIEWED = "lawyer_reviewed"
    REVIEWER_APPROVED = "reviewer_approved"
    REJECTED = "rejected"
    CLOSED = "closed"


class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    description = Column(Text)
    contract_version = Column(String(64), index=True)
    category = Column(String(64), index=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan")
    submissions = relationship("ChecklistSubmission", back_populates="checklist")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    item_order = Column(Integer, default=0)
    section = Column(String(128))
    question = Column(Text, nullable=False)
    description = Column(Text)
    required_evidence = Column(Text)
    default_risk_level = Column(String(32))
    is_required = Column(Boolean, default=True)

    checklist = relationship("Checklist", back_populates="items")
    answers = relationship("ChecklistAnswer", back_populates="item", cascade="all, delete-orphan")
    gaps = relationship("ComplianceGap", back_populates="item")


class ChecklistSubmission(Base):
    __tablename__ = "checklist_submissions"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    submitter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contract_name = Column(String(256), nullable=False)
    contract_version = Column(String(64), index=True)
    counterparty = Column(String(256))
    contract_amount = Column(Float)
    status = Column(Enum(ChecklistStatus), default=ChecklistStatus.DRAFT, index=True)
    deadline = Column(Date, index=True)
    risk_level = Column(String(32), index=True)
    overall_score = Column(Float)
    review_comment = Column(Text)
    submitted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    checklist = relationship("Checklist", back_populates="submissions")
    submitter = relationship("User", back_populates="submissions", foreign_keys=[submitter_id])
    answers = relationship("ChecklistAnswer", back_populates="submission", cascade="all, delete-orphan")
    gaps = relationship("ComplianceGap", back_populates="submission", cascade="all, delete-orphan")
    assignment = relationship("Assignment", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="submission", cascade="all, delete-orphan")


class AnswerStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    NOT_APPLICABLE = "not_applicable"
    PENDING = "pending"


class ChecklistAnswer(Base):
    __tablename__ = "checklist_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("checklist_submissions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    status = Column(Enum(AnswerStatus), default=AnswerStatus.PENDING, index=True)
    answer_text = Column(Text)
    evidence_url = Column(String(512))
    evidence_description = Column(Text)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    submission = relationship("ChecklistSubmission", back_populates="answers")
    item = relationship("ChecklistItem", back_populates="answers")


class GapStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    MITIGATED = "mitigated"
    CLOSED = "closed"
    ACCEPTED = "accepted"


class GapSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ComplianceGap(Base):
    __tablename__ = "compliance_gaps"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("checklist_submissions.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(GapSeverity), default=GapSeverity.MEDIUM, index=True)
    status = Column(Enum(GapStatus), default=GapStatus.OPEN, index=True)
    remediation_plan = Column(Text)
    remediation_deadline = Column(Date, index=True)
    remediation_owner_id = Column(Integer, ForeignKey("users.id"))
    actual_resolve_date = Column(Date)
    resolution_note = Column(Text)
    evidence_details = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    submission = relationship("ChecklistSubmission", back_populates="gaps")
    item = relationship("ChecklistItem", back_populates="gaps")
    owner = relationship("User", foreign_keys=[remediation_owner_id])
    histories = relationship("GapHistory", back_populates="gap", cascade="all, delete-orphan")


class GapHistory(Base):
    __tablename__ = "gap_histories"

    id = Column(Integer, primary_key=True, index=True)
    gap_id = Column(Integer, ForeignKey("compliance_gaps.id"), nullable=False)
    action = Column(String(64), nullable=False)
    field_changed = Column(String(64))
    old_value = Column(Text)
    new_value = Column(Text)
    comment = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    gap = relationship("ComplianceGap", back_populates="histories")
    user = relationship("User", foreign_keys=[user_id])


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    LAWYER_PROCESSING = "lawyer_processing"
    LAWYER_DONE = "lawyer_done"
    REVIEWER_PROCESSING = "reviewer_processing"
    COMPLETED = "completed"


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("checklist_submissions.id"), unique=True, nullable=False)
    lawyer_id = Column(Integer, ForeignKey("users.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, index=True)
    lawyer_deadline = Column(Date)
    reviewer_deadline = Column(Date)
    lawyer_comment = Column(Text)
    reviewer_comment = Column(Text)
    lawyer_started_at = Column(DateTime(timezone=True))
    lawyer_finished_at = Column(DateTime(timezone=True))
    reviewer_started_at = Column(DateTime(timezone=True))
    reviewer_finished_at = Column(DateTime(timezone=True))
    assigned_by = Column(Integer, ForeignKey("users.id"))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    submission = relationship("ChecklistSubmission", back_populates="assignment")
    lawyer = relationship("User", back_populates="lawyer_assignments", foreign_keys=[lawyer_id])
    reviewer = relationship("User", back_populates="reviewer_assignments", foreign_keys=[reviewer_id])


class ConfigType(str, enum.Enum):
    CONTRACT_VERSION = "contract_version"
    RECTIFICATION_PERIOD = "rectification_period"
    RISK_LEVEL = "risk_level"
    EFFECTIVE_CONDITION = "effective_condition"
    CHECKLIST_CATEGORY = "checklist_category"


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_type = Column(Enum(ConfigType), nullable=False, index=True)
    config_key = Column(String(128), nullable=False, index=True)
    config_value = Column(String(512))
    config_data = Column(JSON)
    description = Column(String(256))
    effective_start = Column(Date)
    effective_end = Column(Date)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ReminderType(str, enum.Enum):
    MATERIAL_MISSING = "material_missing"
    DEADLINE_APPROACHING = "deadline_approaching"
    DEADLINE_OVERDUE = "deadline_overdue"
    GAP_NEW = "gap_new"
    ASSIGNMENT_NEW = "assignment_new"
    STATUS_CHANGE = "status_change"


class ReminderStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    PROCESSED = "processed"


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ReminderType), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"))
    submission_id = Column(Integer, ForeignKey("checklist_submissions.id"))
    gap_id = Column(Integer, ForeignKey("compliance_gaps.id"))
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(ReminderStatus), default=ReminderStatus.UNREAD, index=True)
    related_data = Column(JSON)
    read_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", back_populates="received_reminders", foreign_keys=[recipient_id])
    sender = relationship("User", back_populates="sent_reminders", foreign_keys=[sender_id])
    submission = relationship("ChecklistSubmission", back_populates="reminders")
