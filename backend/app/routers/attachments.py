from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import os
import shutil
from datetime import datetime
from app.database import get_db
from app.models import (
    Attachment, SafetyEvent, User, UserRole,
    AttachmentAccessRole
)
from app.schemas import Attachment as AttachmentSchema
from app.auth import require_authenticated
from app.config import settings

router = APIRouter(prefix="", tags=["attachments"])


def attachment_to_schema(att: Attachment, db: Session) -> AttachmentSchema:
    uploader = db.query(User).filter(User.id == att.uploaded_by).first()
    return AttachmentSchema(
        id=att.id,
        event_id=att.event_id,
        filename=att.filename,
        file_type=att.file_type,
        file_size=att.file_size,
        uploaded_by=att.uploaded_by,
        uploaded_by_name=uploader.name if uploader else None,
        access_role=att.access_role,
        created_at=att.created_at
    )


def has_access(attachment: Attachment, user: User, db: Session) -> bool:
    if user.role == UserRole.PROJECT_MANAGER:
        return True
    
    event = db.query(SafetyEvent).filter(SafetyEvent.id == attachment.event_id).first()
    if event and event.teacher_id == user.id:
        if attachment.access_role in [AttachmentAccessRole.ALL, AttachmentAccessRole.TEACHER]:
            return True
    
    if attachment.access_role == AttachmentAccessRole.ALL:
        return True
    
    return False


@router.get("/api/events/{event_id}/attachments", response_model=List[AttachmentSchema])
def get_event_attachments(
    event_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.role == UserRole.TEACHER and event.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    attachments = db.query(Attachment).filter(Attachment.event_id == event_id).all()
    
    accessible = []
    for att in attachments:
        if has_access(att, current_user, db):
            accessible.append(attachment_to_schema(att, db))
    
    return accessible


@router.post("/api/events/{event_id}/attachments", response_model=AttachmentSchema, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    event_id: UUID,
    file: UploadFile = File(...),
    access_role: AttachmentAccessRole = AttachmentAccessRole.ALL,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.role == UserRole.TEACHER and event.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    stored_filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{UUID()}{file_ext}"
    storage_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    
    file_size = 0
    with open(storage_path, "wb") as buffer:
        content = file.file.read()
        file_size = len(content)
        if file_size > settings.MAX_FILE_SIZE:
            os.remove(storage_path)
            raise HTTPException(status_code=400, detail="File too large")
        buffer.write(content)
    
    attachment = Attachment(
        event_id=event_id,
        filename=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        uploaded_by=current_user.id,
        access_role=access_role,
        storage_path=storage_path
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment_to_schema(attachment, db)


@router.get("/api/attachments/{attachment_id}")
def download_attachment(
    attachment_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    if not has_access(attachment, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(attachment.storage_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=attachment.storage_path,
        filename=attachment.filename,
        media_type=attachment.file_type
    )
