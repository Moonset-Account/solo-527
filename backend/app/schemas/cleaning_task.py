from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import CleaningTaskStatus, CleaningTaskPriority


class CleaningTaskBase(BaseModel):
    property_id: int
    priority: Optional[CleaningTaskPriority] = CleaningTaskPriority.NORMAL
    scheduled_time: datetime
    deadline_time: Optional[datetime] = None
    estimated_duration: Optional[float] = 2.0
    cleaning_items: Optional[str] = None
    description: Optional[str] = None


class CleaningTaskCreate(CleaningTaskBase):
    pass


class CleaningTaskUpdate(BaseModel):
    priority: Optional[CleaningTaskPriority] = None
    scheduled_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None
    estimated_duration: Optional[float] = None
    cleaning_items: Optional[str] = None
    description: Optional[str] = None


class CleaningTaskAssign(BaseModel):
    cleaner_id: int


class CleaningTaskSubmit(BaseModel):
    description: Optional[str] = None


class CleaningTaskReview(BaseModel):
    remarks: Optional[str] = None


class CleaningTaskResponse(BaseModel):
    id: int
    task_no: str
    property_id: int
    cleaner_id: Optional[int] = None
    created_by: int
    status: CleaningTaskStatus
    priority: CleaningTaskPriority
    scheduled_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_duration: Optional[float] = None
    actual_duration: Optional[float] = None
    cleaning_items: Optional[str] = None
    description: Optional[str] = None
    inspector_remarks: Optional[str] = None
    is_overdue: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CleaningTaskQuery(BaseModel):
    status: Optional[CleaningTaskStatus] = None
    property_id: Optional[int] = None
    cleaner_id: Optional[int] = None
    priority: Optional[CleaningTaskPriority] = None
    is_overdue: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    community: Optional[str] = None
