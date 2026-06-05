from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from ..database import Base


class AttachmentType(PyEnum):
    REQUISITION = "requisition"
    REAGENT = "reagent"
    INVENTORY_CHECK = "inventory_check"
    AUDIT = "audit"
    OTHER = "other"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    related_type = Column(Enum(AttachmentType), nullable=False)
    related_id = Column(Integer, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
