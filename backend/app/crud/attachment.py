from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.attachment import Attachment, AttachmentType
from ..schemas.attachment import AttachmentCreate
from .base import CRUDBase


class CRUDAttachment(CRUDBase[Attachment, AttachmentCreate, dict]):
    def get_by_related(self, db: Session, *, related_type: AttachmentType, related_id: int) -> List[Attachment]:
        return db.query(Attachment).filter(
            Attachment.related_type == related_type,
            Attachment.related_id == related_id
        ).order_by(Attachment.created_at.desc()).all()


attachment = CRUDAttachment(Attachment)
