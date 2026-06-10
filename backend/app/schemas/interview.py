from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.interview import InterviewType, InterviewStatus, InterviewResult


class InterviewBase(BaseModel):
    application_id: int
    interview_type: InterviewType
    round_number: int = 1
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    interviewer_ids: Optional[str] = None


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    interview_type: Optional[InterviewType] = None
    round_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    interviewer_ids: Optional[str] = None
    status: Optional[InterviewStatus] = None
    result: Optional[InterviewResult] = None
    score: Optional[int] = None
    feedback: Optional[str] = None


class InterviewResultUpdate(BaseModel):
    result: InterviewResult
    score: Optional[int] = None
    feedback: Optional[str] = None


class InterviewResponse(InterviewBase):
    id: int
    status: InterviewStatus
    result: Optional[InterviewResult] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    created_by: Optional[int] = None
    scheduled_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InterviewConflictResponse(BaseModel):
    has_conflict: bool
    conflicts: List[dict]
