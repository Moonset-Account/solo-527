from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import FeedbackType


class QAFeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    comment: Optional[str] = None
    corrected_answer: Optional[str] = None
    is_error_sample: bool = False
    error_category: Optional[str] = None


class QAFeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    feedback_type: FeedbackType
    user_id: Optional[str] = None
    comment: Optional[str] = None
    corrected_answer: Optional[str] = None
    is_error_sample: bool = False
    error_category: Optional[str] = None
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime


class ErrorSampleBase(BaseModel):
    question: str = Field(..., min_length=1)
    incorrect_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    error_category: Optional[str] = None
    severity: str = Field("medium", pattern="^(low|medium|high|critical)$")
    notes: Optional[str] = None
    labels: Optional[List[str]] = None


class ErrorSampleCreate(ErrorSampleBase):
    source_feedback_id: Optional[int] = None
    model_version: Optional[str] = None
    dataset_version: Optional[str] = None


class ErrorSampleUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(open|in_progress|resolved|archived)$")
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    expected_answer: Optional[str] = None
    labels: Optional[List[str]] = None
    severity: Optional[str] = None
    resolution_note: Optional[str] = None


class ErrorSampleOut(ErrorSampleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_feedback_id: Optional[int] = None
    model_version: Optional[str] = None
    dataset_version: Optional[str] = None
    status: str
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
