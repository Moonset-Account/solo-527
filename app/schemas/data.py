from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import DataSourceType, DocumentStatus, ReviewAction, PaginatedResponse


class DataSourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_type: DataSourceType
    description: Optional[str] = None
    version: str = Field("v1", max_length=64)
    is_active: bool = True
    connection_config: Optional[Dict[str, Any]] = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None
    connection_config: Optional[Dict[str, Any]] = None


class DataSourceOut(DataSourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    file_path: Optional[str] = Field(None, max_length=1024)
    source_url: Optional[str] = Field(None, max_length=1024)
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    content: str = Field(..., min_length=1)
    language: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    data_version: Optional[str] = None


class DocumentCreate(DocumentBase):
    data_source_id: int


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    source_url: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    status: Optional[DocumentStatus] = None
    metadata_: Optional[Dict[str, Any]] = None


class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    data_source_id: int
    status: DocumentStatus
    cleaning_score: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    content_hash: Optional[str] = None


class DocumentBatchCreate(BaseModel):
    data_source_id: int
    documents: List[DocumentCreate]


class DocumentReviewCreate(BaseModel):
    action: ReviewAction
    comment: Optional[str] = None
    quality_score: Optional[float] = Field(None, ge=0, le=1)
    issues_detected: Optional[List[str]] = None


class DocumentReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    reviewer: str
    action: ReviewAction
    comment: Optional[str] = None
    quality_score: Optional[float] = None
    issues_detected: Optional[List[str]] = None
    created_at: datetime


class DatasetVersionBase(BaseModel):
    version_tag: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = None


class DatasetVersionCreate(DatasetVersionBase):
    data_source_id: int


class DatasetVersionOut(DatasetVersionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    data_source_id: int
    document_count: int = 0
    checksum: Optional[str] = None
    storage_path: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime


class CleaningReport(BaseModel):
    total_documents: int = 0
    cleaned_documents: int = 0
    skipped_documents: int = 0
    failed_documents: int = 0
    average_score: Optional[float] = None
    quality_issues: Dict[str, int] = Field(default_factory=dict)
