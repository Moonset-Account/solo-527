from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.task import FeedbackType


class QAAnswerRequest(BaseSchema):
    contract_id: int = Field(..., description="合同ID")
    question: str = Field(..., min_length=1, description="问题")
    conversation_id: Optional[str] = Field(None, description="会话ID, 用于上下文")
    top_k: int = Field(5, ge=1, le=20, description="检索top_k")


class SourceReference(BaseSchema):
    clause_id: Optional[int] = None
    clause_title: Optional[str] = None
    clause_text: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None


class QAAnswer(BaseSchema):
    answer_id: str
    contract_id: int
    conversation_id: str
    question: str
    answer: str
    sources: List[SourceReference] = Field(default_factory=list)
    confidence: float = 0.0
    model_version: Optional[str] = None
    tokens_used: int = 0
    latency_ms: int = 0
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class ConversationMessage(BaseSchema):
    role: str = Field(..., description="user/assistant/system")
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class ConversationInfo(BaseSchema):
    conversation_id: str
    contract_id: int
    title: Optional[str] = None
    messages: List[ConversationMessage] = Field(default_factory=list)
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


class QAFeedbackRequest(BaseSchema):
    answer_id: str = Field(..., description="回答ID")
    feedback_type: FeedbackType = Field(..., description="反馈类型")
    score: Optional[float] = Field(None, description="评分")
    content: Optional[str] = Field(None, description="反馈内容")
    corrected_text: Optional[str] = Field(None, description="修正文本")
    metadata: Optional[Dict[str, Any]] = None
