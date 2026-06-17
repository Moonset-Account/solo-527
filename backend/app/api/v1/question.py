from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.question import (
    QuestionBank, QuestionBankStatus, Attachment, Remark, HistoryRecord,
)
from app.schemas.common import (
    QuestionBankCreate, QuestionBankResponse,
    AttachmentResponse, RemarkResponse, HistoryResponse,
)

router = APIRouter()


def _gen_code(prefix, db, model):
    p = f"{prefix}{datetime.now().strftime('%Y%m%d')}"
    last = db.query(model).order_by(model.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{p}{seq:04d}"


@router.get("/banks", response_model=List[QuestionBankResponse])
def list_question_banks(
    major: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    status: Optional[QuestionBankStatus] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(QuestionBank)
    if major:
        query = query.filter(QuestionBank.major == major)
    if subject:
        query = query.filter(QuestionBank.subject == subject)
    if status:
        query = query.filter(QuestionBank.status == status)
    if keyword:
        query = query.filter(
            (QuestionBank.version_name.like(f"%{keyword}%")) |
            (QuestionBank.version_code.like(f"%{keyword}%")) |
            (QuestionBank.description.like(f"%{keyword}%"))
        )
    items = query.order_by(QuestionBank.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return [QuestionBankResponse(
        **{c.name: getattr(q, c.name) for c in q.__table__.columns}
    ) for q in items]


@router.post("/banks", response_model=QuestionBankResponse)
def create_question_bank(data: QuestionBankCreate, db: Session = Depends(get_db)):
    q = QuestionBank(
        **data.model_dump(),
        version_code=_gen_code("QB", db, QuestionBank),
        created_by=1,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionBankResponse(
        **{c.name: getattr(q, c.name) for c in q.__table__.columns}
    )


@router.put("/banks/{qb_id}/publish")
def publish_question_bank(qb_id: int, db: Session = Depends(get_db)):
    q = db.query(QuestionBank).filter(QuestionBank.id == qb_id).first()
    if not q:
        raise HTTPException(404, "题库不存在")
    q.status = QuestionBankStatus.PUBLISHED
    q.published_by = 1
    q.published_at = datetime.utcnow()
    q.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "已发布", "published_at": str(q.published_at)}


@router.post("/attachments/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_name)
    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)
    att = Attachment(
        file_name=saved_name,
        original_name=file.filename,
        file_path=f"/uploads/{saved_name}",
        file_size=len(content),
        mime_type=file.content_type,
        entity_type=entity_type,
        entity_id=entity_id,
        category=category,
        uploaded_by=1,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return AttachmentResponse(
        **{c.name: getattr(att, c.name) for c in att.__table__.columns}
    )


@router.get("/attachments")
def list_attachments(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
):
    items = db.query(Attachment).filter_by(entity_type=entity_type, entity_id=entity_id).all()
    return [AttachmentResponse(
        **{c.name: getattr(a, c.name) for c in a.__table__.columns}
    ) for a in items]


@router.post("/remarks")
def create_remark(
    entity_type: str,
    entity_id: int,
    content: str,
    is_private: bool = False,
    db: Session = Depends(get_db),
):
    r = Remark(
        content=content,
        entity_type=entity_type,
        entity_id=entity_id,
        created_by=1,
        is_private=is_private,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    u = db.query(User).filter(User.id == r.created_by).first()
    return RemarkResponse(
        **{c.name: getattr(r, c.name) for c in r.__table__.columns},
        created_by_name=u.real_name if u else None,
    )


@router.get("/remarks")
def list_remarks(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    items = db.query(Remark).filter_by(entity_type=entity_type, entity_id=entity_id).order_by(Remark.created_at.desc()).all()
    results = []
    for r in items:
        u = db.query(User).filter(User.id == r.created_by).first()
        results.append(RemarkResponse(
            **{c.name: getattr(r, c.name) for c in r.__table__.columns},
            created_by_name=u.real_name if u else None,
        ))
    return results


@router.get("/history")
def list_history(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    items = (
        db.query(HistoryRecord)
        .filter_by(entity_type=entity_type, entity_id=entity_id)
        .order_by(HistoryRecord.created_at.desc())
        .limit(100)
        .all()
    )
    results = []
    for h in items:
        u = db.query(User).filter(User.id == h.operator_id).first()
        results.append(HistoryResponse(
            **{c.name: getattr(h, c.name) for c in h.__table__.columns},
            operator_name=u.real_name if u else None,
        ))
    return results
