from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.assessment import QuestionType, DifficultyLevel


class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    category: Optional[str] = None
    tags: Optional[str] = None
    options: Optional[dict] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: int = 10
    time_limit_seconds: Optional[int] = None
    is_active: bool = True


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    difficulty: Optional[DifficultyLevel] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    options: Optional[dict] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: Optional[int] = None
    time_limit_seconds: Optional[int] = None
    is_active: Optional[bool] = None


class QuestionResponse(QuestionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssessmentRecordResponse(BaseModel):
    id: int
    application_id: Optional[int] = None
    candidate_id: Optional[int] = None
    score: Optional[int] = None
    total_points: Optional[int] = None
    passed: Optional[bool] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
