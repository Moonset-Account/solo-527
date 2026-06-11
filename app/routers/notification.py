from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import NotificationResponse, NotificationMarkRead, PaginatedResponse
from app.services import NotificationService
from app.utils.security import get_current_user
from app.models import User

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    is_read: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = NotificationService.get_user_notifications(
        db, current_user.id, is_read, page, page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return NotificationService.mark_as_read(db, notification_id, current_user.id)


@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return {"success": True, "marked_count": count}


@router.post("/read-batch")
def mark_batch_as_read(
    data: NotificationMarkRead,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.all:
        count = NotificationService.mark_all_as_read(db, current_user.id)
    elif data.ids:
        count = NotificationService.mark_multiple_as_read(db, data.ids, current_user.id)
    else:
        count = 0
    return {"success": True, "marked_count": count}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    NotificationService.delete_notification(db, notification_id, current_user.id)
    return {"success": True, "message": "删除成功"}
