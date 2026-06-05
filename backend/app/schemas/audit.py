from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.audit import AuditAction


class AuditLog(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: AuditAction
    resource_type: str
    resource_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfflineSyncData(BaseModel):
    sync_type: str
    data: dict
    device_id: Optional[str] = None
