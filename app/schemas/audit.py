from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    actor: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    request_id: Optional[str] = None
    response_status: Optional[int] = None
    details: Optional[Dict[str, Any]] = None


class ApiCallLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: str
    endpoint: str
    method: str
    user_id: Optional[str] = None
    model_version: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    latency_ms: Optional[int] = None
    status_code: Optional[int] = None
    rate_limited: bool = False
    ip_address: Optional[str] = None
    created_at: datetime


class AcceptanceCheck(BaseModel):
    check_name: str
    passed: bool
    message: str
    details: Optional[Dict[str, Any]] = None


class AcceptanceReport(BaseModel):
    generated_at: datetime
    total_checks: int
    passed_checks: int
    failed_checks: int
    checks: List[AcceptanceCheck]
    overview: str
    dataset_versions: List[Dict[str, Any]]
    model_versions: List[Dict[str, Any]]
    call_logs_count: int
    endpoints_covered: List[str]
