from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.models.operation_log import OperationType


class OperationLogResponse(BaseModel):
    id: int
    operation_type: OperationType
    operator_id: Optional[int] = None
    operator_name: Optional[str] = None
    registration_id: Optional[int] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    remark: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationLogListResponse(BaseModel):
    total: int
    items: List[OperationLogResponse]
