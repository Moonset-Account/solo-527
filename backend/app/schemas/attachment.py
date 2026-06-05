from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.attachment import AttachmentType


class AttachmentBase(BaseModel):
    original_name: str
    related_type: AttachmentType
    related_id: int


class AttachmentCreate(AttachmentBase):
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class Attachment(AttachmentBase):
    id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
