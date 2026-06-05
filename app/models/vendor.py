from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class VendorStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ApplicationStatus(str, enum.Enum):
    NEW = "new"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONFIRMED = "confirmed"


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100))
    address = Column(String(500))
    description = Column(Text)
    status = Column(Enum(VendorStatus), default=VendorStatus.PENDING, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("VendorApplication", back_populates="vendor")
    deposits = relationship("Deposit", back_populates="vendor")
    checkin_records = relationship("CheckinRecord", back_populates="vendor")
    violation_notes = relationship("ViolationNote", back_populates="vendor")
    booth_assignments = relationship("BoothAssignment", back_populates="vendor")


class VendorApplication(Base):
    __tablename__ = "vendor_applications"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    event_date = Column(DateTime, nullable=False, index=True)
    product_description = Column(Text)
    booth_preference = Column(String(100))
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.NEW, index=True)
    review_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="applications")
    category = relationship("Category")
    booth_assignment = relationship("BoothAssignment", back_populates="application", uselist=False)
