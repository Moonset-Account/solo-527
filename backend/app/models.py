import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean,
    Enum, Float, JSON, BigInteger
)
from sqlalchemy.orm import relationship
from app.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    AGENT = "agent"
    CUSTOMER = "customer"


class TicketStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ResolutionType(str, enum.Enum):
    KB_SOLUTION = "kb_solution"
    MANUAL = "manual"
    ESCALATED = "escalated"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(RoleEnum), default=RoleEnum.AGENT, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_tickets = relationship("Ticket", back_populates="assigned_agent", foreign_keys="Ticket.assigned_to")
    created_tickets = relationship("Ticket", back_populates="requester", foreign_keys="Ticket.created_by")
    kb_articles = relationship("KnowledgeBaseArticle", back_populates="author")
    feedbacks = relationship("CustomerFeedback", back_populates="reviewer", foreign_keys="CustomerFeedback.reviewed_by")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.PENDING, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    category = Column(String(100))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    parent_ticket_id = Column(Integer, ForeignKey("tickets.id"))
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_ticket_id = Column(Integer, ForeignKey("tickets.id"))
    resolution_type = Column(Enum(ResolutionType))
    resolution_summary = Column(Text)
    kb_article_id = Column(Integer, ForeignKey("kb_articles.id"))
    response_time_seconds = Column(BigInteger)
    resolution_time_seconds = Column(BigInteger)
    has_overdue_risk = Column(Boolean, default=False)
    risk_level = Column(Enum(RiskLevel))
    sla_deadline = Column(DateTime)
    first_response_at = Column(DateTime)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", back_populates="created_tickets", foreign_keys=[created_by])
    assigned_agent = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to])
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")
    kb_article = relationship("KnowledgeBaseArticle", back_populates="referenced_tickets")
    feedback = relationship("CustomerFeedback", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    risk_sample = relationship("RiskSample", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    notes = relationship("TicketNote", back_populates="ticket", cascade="all, delete-orphan")
    timeline_events = relationship("TicketTimeline", back_populates="ticket", cascade="all, delete-orphan")
    similar_tickets = relationship(
        "TicketSimilarity",
        foreign_keys="TicketSimilarity.ticket_id",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="attachments")


class KnowledgeBaseCategory(Base):
    __tablename__ = "kb_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("kb_categories.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    articles = relationship("KnowledgeBaseArticle", back_populates="category")


class KnowledgeBaseArticle(Base):
    __tablename__ = "kb_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    category_id = Column(Integer, ForeignKey("kb_categories.id"))
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    keywords = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("KnowledgeBaseCategory", back_populates="articles")
    author = relationship("User", back_populates="kb_articles")
    referenced_tickets = relationship("Ticket", back_populates="kb_article")
    versions = relationship("KBVersionHistory", back_populates="article", cascade="all, delete-orphan")


class KBVersionHistory(Base):
    __tablename__ = "kb_version_history"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("kb_articles.id"), nullable=False)
    version = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    change_summary = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    article = relationship("KnowledgeBaseArticle", back_populates="versions")


class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, unique=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    review_note = Column(Text)
    reviewed_at = Column(DateTime)

    ticket = relationship("Ticket", back_populates="feedback")
    reviewer = relationship("User", back_populates="feedbacks", foreign_keys=[reviewed_by])


class RiskSample(Base):
    __tablename__ = "risk_samples"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, unique=True)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_type = Column(String(100))
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    detected_by = Column(Integer, ForeignKey("users.id"))
    is_verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime)
    mitigation_note = Column(Text)

    ticket = relationship("Ticket", back_populates="risk_sample")


class TicketNote(Base):
    __tablename__ = "ticket_notes"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_internal = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="notes")


class TicketTimeline(Base):
    __tablename__ = "ticket_timeline"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="timeline_events")


class TicketSimilarity(Base):
    __tablename__ = "ticket_similarities"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    similar_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", foreign_keys=[ticket_id], back_populates="similar_tickets")
