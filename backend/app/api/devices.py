from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, create_audit_log
from app.models import User, DeviceInspection, DeviceStatus, LogAction, UserRole
from app.schemas.request import (
    DeviceInspectionCreate, DeviceInspectionUpdate, DeviceInspectionResponse
)

router = APIRouter(prefix="/devices", tags=["设备巡检"])


@router.get("", response_model=List[DeviceInspectionResponse])
def list_devices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[DeviceStatus] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DeviceInspection)
    if status:
        query = query.filter(DeviceInspection.status == status)
    if keyword:
        query = query.filter(
            (DeviceInspection.device_name.ilike(f"%{keyword}%")) |
            (DeviceInspection.ip_address.ilike(f"%{keyword}%"))
        )
    devices = query.order_by(DeviceInspection.updated_at.desc()).offset(skip).limit(limit).all()
    return devices


@router.post("", response_model=DeviceInspectionResponse)
def create_device(
    request: Request,
    device_data: DeviceInspectionCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_device = DeviceInspection(
        **device_data.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="device",
        resource_id=new_device.id,
        description=f"创建设备巡检记录: {device_data.device_name}",
        ip_address=client_ip
    )

    return new_device


@router.get("/{device_id}", response_model=DeviceInspectionResponse)
def get_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(DeviceInspection).filter(DeviceInspection.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )
    return device


@router.put("/{device_id}", response_model=DeviceInspectionResponse)
def update_device(
    request: Request,
    device_id: int,
    device_data: DeviceInspectionUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    device = db.query(DeviceInspection).filter(DeviceInspection.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )

    update_data = device_data.model_dump(exclude_unset=True)
    update_data["updated_by"] = current_user.id
    for key, value in update_data.items():
        setattr(device, key, value)

    db.commit()
    db.refresh(device)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="device",
        resource_id=device_id,
        description=f"更新设备巡检记录: {device.device_name}",
        details=update_data,
        ip_address=client_ip
    )

    return device


@router.delete("/{device_id}")
def delete_device(
    request: Request,
    device_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    device = db.query(DeviceInspection).filter(DeviceInspection.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在"
        )

    device_name = device.device_name
    db.delete(device)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.DELETE_CONFIG,
        resource_type="device",
        resource_id=device_id,
        description=f"删除设备巡检记录: {device_name}",
        ip_address=client_ip
    )

    return {"message": "删除成功"}
