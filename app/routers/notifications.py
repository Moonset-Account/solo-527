from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models
from app.tasks import import_data_task, export_data_task
from datetime import datetime
import os

router = APIRouter(tags=["通知与系统"])
allow_admin = RoleChecker([models.UserRole.ADMIN])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    task_type: str = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.ImportExportTask)
    if task_type:
        query = query.filter(models.ImportExportTask.task_type == task_type)
    return query.order_by(models.ImportExportTask.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/api/import/{entity_type}", response_model=schemas.ImportExportTaskResponse, dependencies=[Depends(allow_admin_coordinator)])
async def upload_import_file(
    entity_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if entity_type not in ["medicine", "location"]:
        raise HTTPException(status_code=400, detail="不支持的导入类型，仅支持 medicine, location")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="仅支持 Excel 文件 (.xlsx, .xls)")
    
    file_content = await file.read()
    file_path = os.path.join(UPLOAD_DIR, f"import_{entity_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    task = models.ImportExportTask(
        task_type="import",
        entity_type=entity_type,
        file_name=file.filename,
        file_path=file_path,
        created_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    import_data_task.delay(task.id, file_content, entity_type)
    
    return task


@router.post("/api/export/{entity_type}", response_model=schemas.ImportExportTaskResponse, dependencies=[Depends(allow_admin_coordinator)])
def request_export(
    entity_type: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if entity_type not in ["medicine", "registration"]:
        raise HTTPException(status_code=400, detail="不支持的导出类型，仅支持 medicine, registration")
    
    task = models.ImportExportTask(
        task_type="export",
        entity_type=entity_type,
        created_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    export_data_task.delay(task.id, entity_type)
    
    return task


@router.get("/api/import-export-tasks/{task_id}", response_model=schemas.ImportExportTaskResponse)
def get_task_status(
    task_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    task = db.query(models.ImportExportTask).filter(models.ImportExportTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task
