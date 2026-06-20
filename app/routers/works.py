from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
import os
import uuid
from datetime import date

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin
from app.models import Work, Comment, Treatment, User, WorkStatus, CommentStatus, Customer
from app.config import settings

router = APIRouter(prefix="/api", tags=["作品与评论"])


class WorkCreate(BaseModel):
    title: str
    description: str = ""
    treatment_id: Optional[int] = None
    status: WorkStatus = WorkStatus.DRAFT
    sort_order: int = 0


class WorkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    treatment_id: Optional[int] = None
    status: Optional[WorkStatus] = None
    sort_order: Optional[int] = None
    image_url: Optional[str] = None


@router.get("/works")
def list_works(
    status: Optional[WorkStatus] = None,
    treatment_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = db.query(Work)
    if status:
        query = query.filter(Work.status == status)
    if treatment_id:
        query = query.filter(Work.treatment_id == treatment_id)
    if keyword:
        query = query.filter(
            or_(
                Work.title.contains(keyword),
                Work.description.contains(keyword)
            )
        )
    total = query.count()
    works = query.order_by(Work.sort_order.asc(), Work.id.desc()).offset(skip).limit(limit).all()
    items = []
    for w in works:
        items.append({
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "image_url": w.image_url,
            "treatment_id": w.treatment_id,
            "treatment_name": w.treatment.name if w.treatment else None,
            "creator_name": w.creator.full_name,
            "status": w.status.value,
            "view_count": w.view_count,
            "like_count": w.like_count,
            "sort_order": w.sort_order,
            "created_at": w.created_at
        })
    return {"total": total, "items": items}


@router.get("/works/public")
def list_public_works(
    treatment_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Work).filter(Work.status == WorkStatus.PUBLISHED)
    if treatment_id:
        query = query.filter(Work.treatment_id == treatment_id)
    if keyword:
        query = query.filter(
            or_(
                Work.title.contains(keyword),
                Work.description.contains(keyword)
            )
        )
    total = query.count()
    works = query.order_by(Work.sort_order.asc(), Work.id.desc()).offset(skip).limit(limit).all()
    items = []
    for w in works:
        items.append({
            "id": w.id,
            "title": w.title,
            "description": w.description,
            "image_url": w.image_url,
            "treatment_id": w.treatment_id,
            "treatment_name": w.treatment.name if w.treatment else None,
            "view_count": w.view_count,
            "like_count": w.like_count,
            "created_at": w.created_at
        })
    return {"total": total, "items": items}


@router.get("/works/{work_id}")
def get_work(
    work_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    return {
        "id": work.id,
        "title": work.title,
        "description": work.description,
        "image_url": work.image_url,
        "treatment_id": work.treatment_id,
        "treatment_name": work.treatment.name if work.treatment else None,
        "creator_name": work.creator.full_name,
        "status": work.status.value,
        "view_count": work.view_count,
        "like_count": work.like_count,
        "sort_order": work.sort_order,
        "created_at": work.created_at
    }


@router.post("/works")
def create_work(
    data: WorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    work = Work(
        **data.model_dump(),
        creator_id=current_user.id
    )
    db.add(work)
    db.commit()
    db.refresh(work)
    return work


@router.put("/works/{work_id}")
def update_work(
    work_id: int,
    data: WorkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(work, key, value)
    db.commit()
    db.refresh(work)
    return work


@router.delete("/works/{work_id}")
def delete_work(
    work_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="作品不存在")
    db.delete(work)
    db.commit()
    return {"message": "删除成功"}


@router.post("/works/upload")
async def upload_work_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    new_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(upload_dir, new_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "filename": new_filename,
        "url": f"/uploads/{new_filename}"
    }


class CommentCreate(BaseModel):
    work_id: int
    content: str
    rating: int = 5
    customer_name: str = ""


@router.get("/comments")
def list_comments(
    status: Optional[CommentStatus] = None,
    work_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = db.query(Comment)
    if status:
        query = query.filter(Comment.status == status)
    if work_id:
        query = query.filter(Comment.work_id == work_id)
    if keyword:
        query = query.filter(Comment.content.contains(keyword))
    total = query.count()
    comments = query.order_by(desc(Comment.created_at)).offset(skip).limit(limit).all()
    items = []
    for c in comments:
        items.append({
            "id": c.id,
            "work_id": c.work_id,
            "work_title": c.work.title if c.work else "",
            "customer_name": c.customer_name or (c.customer.name if c.customer else "匿名用户"),
            "content": c.content,
            "rating": c.rating,
            "status": c.status.value,
            "reply_content": c.reply_content,
            "created_at": c.created_at,
            "reviewed_at": c.reviewed_at
        })
    return {"total": total, "items": items}


@router.post("/comments")
def create_comment(
    data: CommentCreate,
    db: Session = Depends(get_db)
):
    comment = Comment(
        **data.model_dump(),
        status=CommentStatus.PENDING
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


class CommentReview(BaseModel):
    status: CommentStatus
    reply_content: str = ""


@router.post("/comments/{comment_id}/review")
def review_comment(
    comment_id: int,
    data: CommentReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    from datetime import datetime
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")
    comment.status = data.status
    comment.reply_content = data.reply_content
    comment.reviewed_at = datetime.now()
    comment.reviewed_by = current_user.id
    db.commit()
    db.refresh(comment)
    return comment
