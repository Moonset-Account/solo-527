from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class DataSourceType(str, Enum):
    CODE_REPO = "code_repo"
    API_DOC = "api_doc"
    COMMIT_LOG = "commit_log"
    TEST_SPEC = "test_spec"
    ARCH_NOTE = "arch_note"


class DocumentStatus(str, Enum):
    RAW = "raw"
    CLEANED = "cleaned"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    INDEXED = "indexed"
    ERROR = "error"


class ReviewAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGE = "request_change"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FeedbackType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    CORRECTION = "correction"


class ModelStatus(str, Enum):
    TRAINING = "training"
    READY = "ready"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class PaginationBase(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=200, description="Items per page")


class PaginatedResponse(BaseModel):
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
