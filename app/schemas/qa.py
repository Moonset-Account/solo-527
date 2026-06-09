from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import ConfidenceLevel


class Citation(BaseModel):
    document_id: Optional[int] = None
    node_id: Optional[str] = None
    source_title: str = Field(..., max_length=512)
    file_path: Optional[str] = Field(None, max_length=1024)
    source_url: Optional[str] = Field(None, max_length=1024)
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    snippet: Optional[str] = None
    relevance_score: Optional[float] = None


class SearchResult(BaseModel):
    node_id: str
    score: float
    content: str
    citation: Citation


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(8, ge=1, le=50)
    model_version: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class SemanticSearchResponse(BaseModel):
    query: str
    model_version: str
    results: List[SearchResult]
    total_results: int
    latency_ms: int


class QARequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = None
    model_version: Optional[str] = None
    top_k_context: int = Field(8, ge=1, le=30)
    include_citations: bool = True
    return_reasoning: bool = True
    user_id: Optional[str] = None


class QAResponse(BaseModel):
    conversation_id: int
    session_id: str
    question: str
    answer: str
    model_version: str
    confidence_score: float
    confidence_level: ConfidenceLevel
    citations: List[Citation] = Field(default_factory=list)
    reasoning: Optional[str] = None
    low_confidence_warning: bool = False
    requires_human_review: bool = False
    disclaimers: List[str] = Field(default_factory=list)
    latency_ms: int


class QARecommendation(BaseModel):
    suggested_questions: List[str] = Field(default_factory=list)
    related_docs: List[Citation] = Field(default_factory=list)
