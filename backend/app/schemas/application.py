from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.application import ApplicationStatus, ApplicationStage


class ApplicationBase(BaseModel):
    position_id: int
    source_channel: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    candidate_id: Optional[int] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    current_stage: Optional[ApplicationStage] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    assigned_recruiter: Optional[int] = None


class ApplicationStatusChange(BaseModel):
    to_status: ApplicationStatus
    to_stage: Optional[ApplicationStage] = None
    change_reason: Optional[str] = None
    channel: Optional[str] = None
    remarks: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    position_id: int
    status: ApplicationStatus
    current_stage: ApplicationStage
    source_channel: Optional[str] = None
    assigned_recruiter: Optional[int] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    applied_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplicationDetailResponse(ApplicationResponse):
    candidate: Optional[dict] = None
    position: Optional[dict] = None


class StatusHistoryResponse(BaseModel):
    id: int
    application_id: int
    from_status: Optional[ApplicationStatus] = None
    to_status: ApplicationStatus
    from_stage: Optional[ApplicationStage] = None
    to_stage: Optional[ApplicationStage] = None
    changed_by: Optional[int] = None
    change_reason: Optional[str] = None
    channel: Optional[str] = None
    cycle_days: Optional[int] = None
    changed_at: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True
