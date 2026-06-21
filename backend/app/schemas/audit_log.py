from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AuditLogBase(BaseModel):
    user_id: int
    user_name: str = Field(..., max_length=100)
    action: str = Field(..., max_length=50)
    target_type: str = Field(..., max_length=50)
    target_id: int
    description: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = Field(None, max_length=50)


class AuditLogCreate(BaseModel):
    action: str = Field(..., max_length=50)
    target_type: str = Field(..., max_length=50)
    target_id: int
    description: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]
