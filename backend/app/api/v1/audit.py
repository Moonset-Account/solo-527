from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models

router = APIRouter()

allow_admin = RoleChecker([models.UserRole.ADMIN])


@router.get("", response_model=List[schemas.AuditLog], dependencies=[Depends(allow_admin)])
def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: int = None,
    resource_type: str = None,
    action: models.AuditAction = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.AuditLog)
    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)
    if resource_type:
        query = query.filter(models.AuditLog.resource_type == resource_type)
    if action:
        query = query.filter(models.AuditLog.action == action)
    return query.order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/resource/{resource_type}/{resource_id}", response_model=List[schemas.AuditLog], dependencies=[Depends(allow_admin)])
def get_resource_audit_logs(
    resource_type: str,
    resource_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.audit_log.get_by_resource(
        db, resource_type=resource_type, resource_id=resource_id, skip=skip, limit=limit
    )


@router.delete("/{log_id}", dependencies=[Depends(allow_admin)])
def delete_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    raise HTTPException(
        status_code=403,
        detail="审计日志不允许删除"
    )
