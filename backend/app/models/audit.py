from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    entity_name = Column(String(200))
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String(100))
    role = Column(String(50))
    old_value = Column(JSON)
    new_value = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
