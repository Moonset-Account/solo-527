from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import require_admin, get_current_user
from app.models import AuditLog, ApiErrorLog, LogAction, User
from app.schemas.log import AuditLogResponse, ApiErrorLogResponse, ApiErrorLogResolve

router = APIRouter(prefix="/logs", tags=["日志管理"])


@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[LogAction] = None,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for log in logs:
        resp = AuditLogResponse.model_validate(log)
        if log.user:
            resp.username = log.user.username
        result.append(resp)

    return result


@router.get("/audit/{log_id}", response_model=AuditLogResponse)
def get_audit_log(
    log_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日志不存在"
        )

    resp = AuditLogResponse.model_validate(log)
    if log.user:
        resp.username = log.user.username
    return resp


@router.get("/api-errors", response_model=List[ApiErrorLogResponse])
def get_api_error_logs(
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    status_code: Optional[int] = None,
    method: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ApiErrorLog)
    if resolved is not None:
        query = query.filter(ApiErrorLog.resolved == resolved)
    if status_code:
        query = query.filter(ApiErrorLog.status_code == status_code)
    if method:
        query = query.filter(ApiErrorLog.method == method)

    logs = query.order_by(ApiErrorLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/api-errors/{log_id}", response_model=ApiErrorLogResponse)
def get_api_error_log(
    log_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    log = db.query(ApiErrorLog).filter(ApiErrorLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日志不存在"
        )
    return log


@router.put("/api-errors/{log_id}/resolve", response_model=ApiErrorLogResponse)
def resolve_api_error(
    log_id: int,
    data: ApiErrorLogResolve,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    log = db.query(ApiErrorLog).filter(ApiErrorLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日志不存在"
        )

    log.resolved = True
    log.resolution_note = data.resolution_note
    db.commit()
    db.refresh(log)

    return log
