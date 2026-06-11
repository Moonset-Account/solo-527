from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PurchaseStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    QUOTED = "quoted"
    EXPIRED = "expired"
    DELIVERED = "delivered"
    CLOSED = "closed"


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_no = Column(String(50), unique=True, nullable=False)
    material_name = Column(String(200), nullable=False)
    specification = Column(String(500))
    quantity = Column(Numeric(12, 2), nullable=False)
    unit = Column(String(20), nullable=False)
    budget = Column(Numeric(12, 2), nullable=False)
    expected_delivery = Column(Date, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(PurchaseStatus), default=PurchaseStatus.DRAFT)
    current_approval_level = Column(Integer, default=1)
    spec_attachment_id = Column(Integer)
    closing_note = Column(Text)
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="purchase_requests")
    creator = relationship("User", foreign_keys=[created_by])
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.related_id==PurchaseRequest.id, Attachment.related_type=='purchase')", foreign_keys="Attachment.related_id")
    approval_records = relationship("ApprovalRecord", back_populates="purchase")
    price_records = relationship("PriceRecord", back_populates="purchase")
    delivery_records = relationship("DeliveryRecord", back_populates="purchase")
    notes = relationship("Note", primaryjoin="and_(Note.related_id==PurchaseRequest.id, Note.related_type=='purchase')", foreign_keys="Note.related_id")
