from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel

from app.schemas.common import BaseSchema, PageParams


class OperationLogBase(BaseSchema):
    user_id: Optional[int] = None
    username: Optional[str] = None
    operation_type: str
    module: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_url: Optional[str] = None
    request_params: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    status: str = "success"
    error_msg: Optional[str] = None
    duration: Optional[int] = None


class OperationLogQuery(PageParams):
    keyword: Optional[str] = None
    module: Optional[str] = None
    operation_type: Optional[str] = None
    user_id: Optional[int] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
