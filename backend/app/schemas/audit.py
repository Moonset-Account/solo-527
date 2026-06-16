from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: int
    entity_name: Optional[str] = None
    description: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogInDB(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    role: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
