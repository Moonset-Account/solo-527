from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.models import LogAction


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: LogAction
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApiErrorLogResponse(BaseModel):
    id: int
    method: str
    path: str
    status_code: Optional[int] = None
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    retry_count: int
    last_result: Optional[str] = None
    resolved: bool
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiErrorLogResolve(BaseModel):
    resolution_note: Optional[str] = None


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Any]
