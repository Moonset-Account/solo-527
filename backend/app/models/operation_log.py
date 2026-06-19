from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class OperationType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    CHECKIN = "checkin"
    REFUND = "refund"
    QUALITY_CHANGE = "quality_change"
    STATUS_CHANGE = "status_change"
    EXPORT = "export"
    OTHER = "other"


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    operation_type = Column(Enum(OperationType), default=OperationType.OTHER, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), index=True)
    operator_name = Column(String(100))
    
    registration_id = Column(Integer, ForeignKey("registrations.id"), index=True)
    
    target_type = Column(String(50))
    target_id = Column(Integer)
    
    old_value = Column(JSON)
    new_value = Column(JSON)
    
    remark = Column(Text)
    ip_address = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    registration = relationship("Registration", back_populates="operation_logs")
    operator = relationship("User", back_populates="operations")
