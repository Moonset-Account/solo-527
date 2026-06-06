from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models
from datetime import datetime

router = APIRouter(tags=["通知与系统"])
allow_admin = RoleChecker([models.UserRole.ADMIN])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Notification).filter(models.Notification.recipient_id == current_user.id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    return query.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    return {"message": "已标记为已读"}


@router.post("/api/notifications/send", response_model=schemas.NotificationResponse, dependencies=[Depends(allow_admin_coordinator)])
def send_notification(
    notification_in: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = models.Notification(
        **notification_in.model_dump(),
        sender_id=current_user.id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.get("/api/error-logs", response_model=List[schemas.ErrorLogResponse], dependencies=[Depends(allow_admin)])
def get_error_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(models.ErrorLog).order_by(models.ErrorLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/api/import-export-tasks", response_model=List[schemas.ImportExportTaskResponse])
def get_import_export_tasks(
    skip: int = 0,
    limit: int = 100,
    task_type: str = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.ImportExportTask)
    if task_type:
        query = query.filter(models.ImportExportTask.task_type == task_type)
    return query.order_by(models.ImportExportTask.created_at.desc()).offset(skip).limit(limit).all()
