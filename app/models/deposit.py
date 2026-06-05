from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class DepositStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDING = "refunding"
    REFUNDED = "refunded"
    FORFEITED = "forfeited"
    UNDER_REVIEW = "under_review"


class DepositType(str, enum.Enum):
    STANDARD = "standard"
    ADDITIONAL = "additional"


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("vendor_applications.id"), index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    deposit_type = Column(Enum(DepositType), default=DepositType.STANDARD)
    status = Column(Enum(DepositStatus), default=DepositStatus.PENDING, index=True)
    payment_method = Column(String(50))
    transaction_id = Column(String(200))
    paid_at = Column(DateTime)
    refund_method = Column(String(50))
    refund_transaction_id = Column(String(200))
    refunded_at = Column(DateTime)
    review_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="deposits")
