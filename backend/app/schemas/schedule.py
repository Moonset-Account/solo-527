from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class ScheduleBase(BaseModel):
    staff_id: int
    date: date
    shift_type: str = Field(..., max_length=20)
    work_load: int = 0
    foster_risk_reasons: Optional[str] = Field(None, max_length=500)
    risk_level: str = Field(default="low", max_length=20)


class ScheduleCreate(BaseModel):
    staff_id: int
    date: date
    shift_type: str = Field(..., max_length=20)
    work_load: int = 0
    foster_risk_reasons: Optional[str] = Field(None, max_length=500)
    risk_level: str = Field(default="low", max_length=20)


class ScheduleUpdate(BaseModel):
    shift_type: Optional[str] = Field(None, max_length=20)
    work_load: Optional[int] = None
    foster_risk_reasons: Optional[str] = Field(None, max_length=500)
    risk_level: Optional[str] = Field(None, max_length=20)


class ScheduleResponse(ScheduleBase):
    id: int
    staff_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduleListResponse(BaseModel):
    total: int
    items: List[ScheduleResponse]


class LoadAnalysisQuery(BaseModel):
    start_date: date
    end_date: date
    staff_id: Optional[int] = None
    dimension: str = Field(..., max_length=20)


class RiskBreakdownItem(BaseModel):
    reason: str
    count: int


class LoadAnalysisResult(BaseModel):
    dimension: str
    labels: List[str]
    data: List[int]
    risk_breakdown: Optional[List[RiskBreakdownItem]] = None
