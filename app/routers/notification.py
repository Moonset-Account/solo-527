from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.schemas import NotificationResponse, NotificationMarkRead, PaginatedResponse
from app.services import NotificationService
from app.utils.security import get_current_user
from app.models import User, PurchaseRequest
from app.utils.file_handler import get_file_path
from fastapi.responses import FileResponse
import os

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    is_read: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = NotificationService.get_user_notifications(
        db, current_user.id, is_read=is_read,
        notification_type=type, page=page, page_size=page_size
    )
    result_items = []
    for item in items:
        resp = NotificationResponse.model_validate(item)
        if item.related_type == "purchase" and item.related_id:
            purchase = db.query(PurchaseRequest).filter(PurchaseRequest.id == item.related_id).first()
            if purchase:
                resp.related_url = f"/purchase/{purchase.id}"
                resp.related_title = purchase.request_no
        result_items.append(resp)
    return PaginatedResponse(
        items=result_items,
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


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = NotificationService.mark_as_read(db, notification_id, current_user.id)
    return {"success": True, "data": NotificationResponse.model_validate(notification)}


@router.put("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return {"success": True, "marked_count": count}


@router.put("/batch-read")
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


@router.delete("/batch-delete")
def batch_delete_notifications(
    data: NotificationMarkRead,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import Notification
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if data.ids:
        query = query.filter(Notification.id.in_(data.ids))
    count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": count}


@router.get("/{notification_id}/download")
def download_attachment_from_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import Notification, Attachment
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="通知不存在")
    
    attachment = None
    if notification.related_type == "purchase" and notification.related_id:
        attachment = db.query(Attachment).filter(
            Attachment.related_id == notification.related_id,
            Attachment.related_type == "purchase"
        ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="没有可下载的附件")
    
    file_path = get_file_path(attachment.filename, sub_dir=f"{attachment.related_type}/{attachment.related_id}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        file_path,
        media_type=attachment.file_type or "application/octet-stream",
        filename=attachment.original_name
    )
