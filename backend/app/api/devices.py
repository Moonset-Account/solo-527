from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator, get_client_ip
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceListResponse
from app.crud import crud_device, crud_event, crud_operation_log
from app.models.user import User
from app.models.device import DeviceStatus, DeviceType
from app.models.operation_log import OperationType

router = APIRouter(prefix="/devices", tags=["设备管理"])


@router.get("", response_model=DeviceListResponse)
def list_devices(
    event_id: Optional[int] = None,
    device_status: Optional[DeviceStatus] = None,
    device_type: Optional[DeviceType] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    skip = (page - 1) * page_size
    if event_id:
        items, total = crud_device.get_multi_by_event(
            db, event_id=event_id, skip=skip, limit=page_size,
            device_status=device_status, device_type=device_type,
        )
    else:
        query = db.query(crud_device.model)
        if device_status:
            query = query.filter(crud_device.model.device_status == device_status)
        if device_type:
            query = query.filter(crud_device.model.device_type == device_type)
        total = query.count()
        items = query.order_by(crud_device.model.created_at.desc()).offset(skip).limit(page_size).all()
    return {"total": total, "items": items}


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    device = crud_device.get(db, id=device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在",
        )
    return device


@router.get("/code/{device_code}", response_model=DeviceResponse)
def get_device_by_code(
    device_code: str,
    db: Session = Depends(get_db),
):
    device = crud_device.get_by_device_code(db, device_code=device_code)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在",
        )
    if device.device_status != DeviceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="设备未激活",
        )
    return device


@router.post("", response_model=DeviceResponse)
def create_device(
    device_in: DeviceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    existing = crud_device.get_by_device_code(db, device_code=device_in.device_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="设备编号已存在",
        )
    event = crud_event.get(db, id=device_in.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    
    device = crud_device.create(db, obj_in=device_in)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CREATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="device",
        target_id=device.id,
        new_value={"device_code": device.device_code, "device_name": device.device_name},
        remark="创建设备",
        ip_address=get_client_ip(request),
    )
    
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_in: DeviceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    device = crud_device.get(db, id=device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在",
        )
    
    old_data = {c.name: getattr(device, c.name) for c in device.__table__.columns}
    device = crud_device.update(db, db_obj=device, obj_in=device_in)
    
    update_data = device_in.model_dump(exclude_unset=True)
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="device",
        target_id=device.id,
        old_value=old_data,
        new_value=update_data,
        remark="更新设备信息",
        ip_address=get_client_ip(request),
    )
    
    return device


@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    device = crud_device.get(db, id=device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="设备不存在",
        )
    
    crud_device.remove(db, id=device_id)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.DELETE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="device",
        target_id=device_id,
        old_value={"device_code": device.device_code, "device_name": device.device_name},
        remark="删除设备",
        ip_address=get_client_ip(request),
    )
    
    return {"message": "删除成功"}
