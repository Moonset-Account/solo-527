from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models import (
    RoleEnum, TicketStatus, TicketPriority, RiskLevel, ResolutionType
)


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.AGENT


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: int
    ticket_id: int
    filename: str
    original_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketNoteResponse(BaseModel):
    id: int
    ticket_id: int
    content: str
    created_by: int
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TicketTimelineResponse(BaseModel):
    id: int
    ticket_id: int
    event_type: str
    description: Optional[str] = None
    created_by: Optional[int] = None
    metadata: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_type: Optional[ResolutionType] = None
    resolution_summary: Optional[str] = None
    kb_article_id: Optional[int] = None
    risk_level: Optional[RiskLevel] = None


class TicketNoteCreate(BaseModel):
    content: str
    is_internal: bool = True


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: Optional[str] = None
    created_by: int
    assigned_to: Optional[int] = None
    is_duplicate: bool
    resolution_type: Optional[ResolutionType] = None
    resolution_summary: Optional[str] = None
    kb_article_id: Optional[int] = None
    response_time_seconds: Optional[int] = None
    resolution_time_seconds: Optional[int] = None
    has_overdue_risk: bool
    risk_level: Optional[RiskLevel] = None
    sla_deadline: Optional[datetime] = None
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KBCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class KBCategoryCreate(KBCategoryBase):
    pass


class KBCategoryResponse(KBCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class KBArticleBase(BaseModel):
    title: str
    content: str
    category_id: Optional[int] = None
    keywords: Optional[List[str]] = []


class KBArticleCreate(KBArticleBase):
    pass


class KBArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    keywords: Optional[List[str]] = None
    is_published: Optional[bool] = None
    change_summary: Optional[str] = None


class KBArticleResponse(KBArticleBase):
    id: int
    version: int
    author_id: int
    is_published: bool
    view_count: int
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KBArticleDetailResponse(KBArticleResponse):
    author: Optional[UserResponse] = None
    category: Optional[KBCategoryResponse] = None


class KBVersionResponse(BaseModel):
    id: int
    article_id: int
    version: int
    title: str
    content: str
    changed_by: Optional[int] = None
    change_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerFeedbackBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class CustomerFeedbackCreate(CustomerFeedbackBase):
    ticket_id: int


class CustomerFeedbackResponse(CustomerFeedbackBase):
    id: int
    ticket_id: int
    submitted_at: datetime
    reviewed_by: Optional[int] = None
    review_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RiskSampleBase(BaseModel):
    risk_level: RiskLevel
    risk_type: Optional[str] = None
    description: Optional[str] = None


class RiskSampleCreate(RiskSampleBase):
    ticket_id: int


class RiskSampleResponse(RiskSampleBase):
    id: int
    ticket_id: int
    detected_at: datetime
    detected_by: Optional[int] = None
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    mitigation_note: Optional[str] = None

    class Config:
        from_attributes = True


class TicketDetailResponse(TicketResponse):
    requester: Optional[UserResponse] = None
    assigned_agent: Optional[UserResponse] = None
    attachments: List[AttachmentResponse] = []
    notes: List[TicketNoteResponse] = []
    timeline_events: List[TicketTimelineResponse] = []
    feedback: Optional[CustomerFeedbackResponse] = None
    risk_samples: List[RiskSampleResponse] = []
    kb_article: Optional[KBArticleResponse] = None
    kb_versions: List[KBVersionResponse] = []


class TicketListResponse(BaseModel):
    items: List[TicketResponse]
    total: int
    page: int
    page_size: int


class StatsOverview(BaseModel):
    total_tickets: int = 0
    pending_tickets: int = 0
    processing_tickets: int = 0
    resolved_tickets: int = 0
    avg_response_time: Optional[float] = None
    avg_resolution_time: Optional[float] = None
    overdue_count: int = 0
    duplicate_count: int = 0
    avg_feedback_rating: Optional[float] = None
    high_risk_count: int = 0


class TicketSimilarityResponse(BaseModel):
    ticket_id: int
    similar_ticket_id: int
    similarity_score: float
    ticket_title: Optional[str] = None
    calculated_at: datetime

    class Config:
        from_attributes = True
