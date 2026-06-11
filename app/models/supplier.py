from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    address = Column(Text)
    business_license = Column(String(200))
    qualification_cert = Column(String(200))
    status = Column(String(20), default="pending")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    purchase_requests = relationship("PurchaseRequest", back_populates="supplier")
    audits = relationship("SupplierAudit", back_populates="supplier")
    risk_assessments = relationship("RiskAssessment", back_populates="supplier")
    price_records = relationship("PriceRecord", back_populates="supplier")
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.related_id==Supplier.id, Attachment.related_type=='supplier')", foreign_keys="Attachment.related_id")
    creator = relationship("User", foreign_keys=[created_by])


class SupplierAudit(Base):
    __tablename__ = "supplier_audits"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"))
    auditor_id = Column(Integer, ForeignKey("users.id"))
    audit_result = Column(String(20), nullable=False)
    audit_opinion = Column(Text)
    audited_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", back_populates="audits")
    auditor = relationship("User", foreign_keys=[auditor_id])


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"))
    assessor_id = Column(Integer, ForeignKey("users.id"))
    risk_level = Column(Enum(RiskLevel), nullable=False)
    description = Column(Text)
    assessed_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", back_populates="risk_assessments")
    assessor = relationship("User", foreign_keys=[assessor_id])
