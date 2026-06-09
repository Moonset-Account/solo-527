from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from app.models import UserRole, FeedbackCategory, AuditStatus


class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6)
    real_name: Optional[str] = None
    role: UserRole
    class_id: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    class_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ClassCreate(BaseModel):
    class_name: str
    grade: str
    head_teacher_id: Optional[int] = None


class ClassResponse(BaseModel):
    id: int
    class_name: str
    grade: str
    head_teacher_id: Optional[int] = None
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True


class EssaySubmit(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=50)
    topic_tag: Optional[str] = None
    class_id: int

    @field_validator("content")
    @classmethod
    def content_not_full_generation(cls, v: str) -> str:
        if len(v) > 10000:
            raise ValueError("作文内容过长")
        return v


class EssayResponse(BaseModel):
    id: int
    title: str
    content_masked: str
    word_count: int
    topic_tag: Optional[str]
    submitted_at: datetime
    has_feedback: bool = False
    has_teacher_review: bool = False
    is_low_confidence: bool = False

    class Config:
        from_attributes = True


class EssayDetailResponse(EssayResponse):
    feedbacks: List["EssayFeedbackResponse"] = []
    teacher_review: Optional["TeacherReviewResponse"] = None


class FeedbackItemResponse(BaseModel):
    id: int
    category: FeedbackCategory
    original_text: Optional[str] = None
    suggestion_text: str
    revised_suggestion: Optional[str] = None
    location_start: Optional[int] = None
    location_end: Optional[int] = None
    confidence: float
    is_low_confidence: bool
    severity: str
    audit_status: AuditStatus
    audit_note: Optional[str] = None
    audited_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ModelEvidenceResponse(BaseModel):
    id: int
    evidence_type: str
    evidence_data: Dict[str, Any]
    description: Optional[str] = None

    class Config:
        from_attributes = True


class EssayFeedbackResponse(BaseModel):
    id: int
    essay_id: int
    category: FeedbackCategory
    prompt_version_id: Optional[int] = None
    prompt_version_code: Optional[str] = None
    generated_at: datetime
    model_name: str
    overall_confidence: float
    is_low_confidence: bool
    items: List[FeedbackItemResponse] = []
    evidence_refs: List[ModelEvidenceResponse] = []

    class Config:
        from_attributes = True


class FeedbackItemAudit(BaseModel):
    item_id: int
    audit_status: AuditStatus
    audit_note: Optional[str] = None
    revised_suggestion: Optional[str] = Field(None, max_length=2000)


class FeedbackBatchAudit(BaseModel):
    feedback_id: int
    items: List[FeedbackItemAudit]


class TeacherReviewCreate(BaseModel):
    essay_id: int
    final_score: Optional[float] = Field(None, ge=0, le=100)
    overall_comment: str = Field(..., max_length=3000)
    structure_rating: Optional[int] = Field(None, ge=1, le=5)
    evidence_rating: Optional[int] = Field(None, ge=1, le=5)
    expression_rating: Optional[int] = Field(None, ge=1, le=5)


class TeacherReviewResponse(BaseModel):
    id: int
    essay_id: int
    teacher_id: int
    final_score: Optional[float] = None
    overall_comment_masked: Optional[str] = None
    structure_rating: Optional[int] = None
    evidence_rating: Optional[int] = None
    expression_rating: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PromptVersionCreate(BaseModel):
    version_code: str
    category: FeedbackCategory
    prompt_content: str
    description: Optional[str] = None
    is_active: bool = True


class PromptVersionResponse(BaseModel):
    id: int
    version_code: str
    category: FeedbackCategory
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClassStatsResponse(BaseModel):
    class_id: int
    class_name: str
    grade: str
    total_students: int
    total_essays: int
    reviewed_essays: int
    avg_structure_rating: Optional[float] = None
    avg_evidence_rating: Optional[float] = None
    avg_expression_rating: Optional[float] = None
    avg_final_score: Optional[float] = None
    low_confidence_count: int
    category_breakdown: Dict[str, int]
    top_suggestions: List[Dict[str, Any]] = []


class ExportOptions(BaseModel):
    class_ids: Optional[List[int]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_low_confidence: bool = False


EssayDetailResponse.model_rebuild()
