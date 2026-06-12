from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime, date
from ..models import GapStatus, GapSeverity, AssignmentStatus, ConfigType, ReminderType, ReminderStatus


class GapBase(BaseModel):
    submission_id: int
    item_id: int
    description: str
    severity: GapSeverity = GapSeverity.MEDIUM
    status: GapStatus = GapStatus.OPEN
    remediation_plan: Optional[str] = None
    remediation_deadline: Optional[date] = None
    remediation_owner_id: Optional[int] = None
    resolution_note: Optional[str] = None
    evidence_details: Optional[List[Any]] = []


class GapCreate(GapBase):
    pass


class GapUpdate(BaseModel):
    description: Optional[str] = None
    severity: Optional[GapSeverity] = None
    status: Optional[GapStatus] = None
    remediation_plan: Optional[str] = None
    remediation_deadline: Optional[date] = None
    remediation_owner_id: Optional[int] = None
    actual_resolve_date: Optional[date] = None
    resolution_note: Optional[str] = None
    evidence_details: Optional[List[Any]] = None
    comment: Optional[str] = None


class GapHistoryResponse(BaseModel):
    id: int
    gap_id: int
    action: str
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comment: Optional[str] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GapResponse(GapBase):
    id: int
    actual_resolve_date: Optional[date] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    days_left: Optional[int] = None
    remediation_owner_name: Optional[str] = None
    histories: List[GapHistoryResponse] = []

    class Config:
        from_attributes = True


class GapList(BaseModel):
    total: int
    items: List[GapResponse]


class AssignmentBase(BaseModel):
    submission_id: int
    lawyer_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    lawyer_deadline: Optional[date] = None
    reviewer_deadline: Optional[date] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    lawyer_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    lawyer_deadline: Optional[date] = None
    reviewer_deadline: Optional[date] = None
    status: Optional[AssignmentStatus] = None
    lawyer_comment: Optional[str] = None
    reviewer_comment: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: int
    status: AssignmentStatus
    lawyer_comment: Optional[str] = None
    reviewer_comment: Optional[str] = None
    lawyer_started_at: Optional[datetime] = None
    lawyer_finished_at: Optional[datetime] = None
    reviewer_started_at: Optional[datetime] = None
    reviewer_finished_at: Optional[datetime] = None
    assigned_by: Optional[int] = None
    assigned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssignmentList(BaseModel):
    total: int
    items: List[AssignmentResponse]


class ConfigBase(BaseModel):
    config_type: ConfigType
    config_key: str
    config_value: Optional[str] = None
    config_data: Optional[Any] = None
    description: Optional[str] = None
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None
    is_active: bool = True
    sort_order: int = 0


class ConfigCreate(ConfigBase):
    pass


class ConfigUpdate(BaseModel):
    config_value: Optional[str] = None
    config_data: Optional[Any] = None
    description: Optional[str] = None
    effective_start: Optional[date] = None
    effective_end: Optional[date] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ConfigResponse(ConfigBase):
    id: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReminderResponse(BaseModel):
    id: int
    type: ReminderType
    recipient_id: int
    sender_id: Optional[int] = None
    submission_id: Optional[int] = None
    gap_id: Optional[int] = None
    title: str
    content: str
    status: ReminderStatus
    related_data: Optional[Any] = None
    read_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReminderList(BaseModel):
    total: int
    unread_count: int
    items: List[ReminderResponse]


class ReminderMark(BaseModel):
    ids: List[int]
    action: str = "read"
