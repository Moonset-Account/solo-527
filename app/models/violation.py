from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class ViolationSeverity(str, enum.Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"


class ViolationStatus(str, enum.Enum):
    REPORTED = "reported"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    APPEALED = "appealed"


class ViolationNote(Base):
    __tablename__ = "violation_notes"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    event_date = Column(DateTime, index=True)
    reported_by = Column(Integer, ForeignKey("users.id"))
    severity = Column(Enum(ViolationSeverity), default=ViolationSeverity.MINOR)
    status = Column(Enum(ViolationStatus), default=ViolationStatus.REPORTED, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    action_taken = Column(Text)
    resolution_notes = Column(Text)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="violation_notes")
