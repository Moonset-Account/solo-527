from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PositionBase(BaseModel):
    title: str
    department: Optional[str] = None
    job_type: Optional[str] = None
    city: Optional[str] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    headcount: Optional[int] = 1
    is_active: Optional[bool] = True


class PositionCreate(PositionBase):
    pass


class PositionUpdate(PositionBase):
    title: Optional[str] = None


class PositionResponse(PositionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
