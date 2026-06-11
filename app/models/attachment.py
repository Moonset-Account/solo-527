from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(100))
    file_size = Column(BigInteger, nullable=False)
    related_id = Column(Integer, nullable=False)
    related_type = Column(String(50), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, server_default=func.now())

    uploader = relationship("User", foreign_keys=[uploaded_by])


class SpecAttachment(Base):
    __tablename__ = "spec_attachments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(100))
    file_size = Column(BigInteger)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    uploader = relationship("User", foreign_keys=[uploaded_by])


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    related_id = Column(Integer, nullable=False)
    related_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])
