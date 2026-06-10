from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class CandidateBase(BaseModel):
    name: str
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    source_channel: Optional[str] = None
    expected_salary: Optional[str] = None
    city: Optional[str] = None
    skills: Optional[str] = None
    introduction: Optional[str] = None


class CandidateCreate(CandidateBase):
    user_id: Optional[int] = None


class CandidateUpdate(CandidateBase):
    resume_url: Optional[str] = None
    avatar: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    user_id: Optional[int] = None
    resume_url: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CandidateWithUser(CandidateResponse):
    user: Optional[dict] = None
