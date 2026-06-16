from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, create_audit_log
from app.models import User, Alert, AlertStatus, AlertSeverity, LogAction, UserRole
from app.schemas.request import (
    AlertCreate, AlertUpdate, AlertResponse,
    AlertConfirm, AlertResolve
)

router = APIRouter(prefix="/alerts", tags=["告警管理"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[AlertStatus] = None,
    severity: Optional[AlertSeverity] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if keyword:
        query = query.filter(
            (Alert.title.ilike(f"%{keyword}%")) |
            (Alert.device_name.ilike(f"%{keyword}%"))
        )
    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts


@router.post("", response_model=AlertResponse)
def create_alert(
    request: Request,
    alert_data: AlertCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_alert = Alert(
        **alert_data.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="alert",
        resource_id=new_alert.id,
        description=f"创建告警: {alert_data.title}",
        ip_address=client_ip
    )

    return new_alert


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )
    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(
    request: Request,
    alert_id: int,
    alert_data: AlertUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )

    update_data = alert_data.model_dump(exclude_unset=True)
    update_data["updated_by"] = current_user.id
    for key, value in update_data.items():
        setattr(alert, key, value)

    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="alert",
        resource_id=alert_id,
        description=f"更新告警: {alert.title}",
        details=update_data,
        ip_address=client_ip
    )

    return alert


@router.post("/{alert_id}/confirm", response_model=AlertResponse)
def confirm_alert(
    request: Request,
    alert_id: int,
    data: AlertConfirm,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )

    if alert.status != AlertStatus.UNCONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="告警状态不允许确认"
        )

    alert.status = AlertStatus.CONFIRMED
    alert.confirmed_by = current_user.id
    alert.confirmed_at = datetime.utcnow()
    alert.confirmed_comment = data.comment
    alert.updated_by = current_user.id

    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="alert",
        resource_id=alert_id,
        description=f"确认告警: {alert.title}",
        ip_address=client_ip
    )

    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    request: Request,
    alert_id: int,
    data: AlertResolve,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )

    if alert.status == AlertStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="告警已解决"
        )

    alert.status = AlertStatus.RESOLVED
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    alert.resolution = data.resolution
    alert.updated_by = current_user.id

    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="alert",
        resource_id=alert_id,
        description=f"解决告警: {alert.title}",
        ip_address=client_ip
    )

    return alert


@router.delete("/{alert_id}")
def delete_alert(
    request: Request,
    alert_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="告警不存在"
        )

    alert_title = alert.title
    db.delete(alert)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.DELETE_CONFIG,
        resource_type="alert",
        resource_id=alert_id,
        description=f"删除告警: {alert_title}",
        ip_address=client_ip
    )

    return {"message": "删除成功"}
