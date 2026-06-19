from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator, get_client_ip
from app.schemas.registration import (
    RegistrationCreate, RegistrationUpdate, RegistrationResponse,
    RegistrationListResponse, RegistrationDetailResponse, RegistrationQualityUpdate
)
from app.schemas.todo import TodoCreate, TodoType, TodoPriority
from app.crud import crud_registration, crud_event, crud_operation_log, crud_refund_exception, crud_todo
from app.models.user import User
from app.models.registration import RegistrationStatus, RegistrationQuality
from app.models.operation_log import OperationType

router = APIRouter(prefix="/registrations", tags=["报名管理"])


@router.get("", response_model=RegistrationListResponse)
def list_registrations(
    event_id: Optional[int] = None,
    status: Optional[RegistrationStatus] = None,
    quality: Optional[RegistrationQuality] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    skip = (page - 1) * page_size
    if event_id:
        items, total = crud_registration.get_multi_by_event(
            db, event_id=event_id, skip=skip, limit=page_size,
            status=status, quality=quality, keyword=keyword,
        )
    else:
        query = db.query(crud_registration.model)
        if status:
            query = query.filter(crud_registration.model.status == status)
        if quality:
            query = query.filter(crud_registration.model.quality == quality)
        if keyword:
            from sqlalchemy import or_
            query = query.filter(
                or_(
                    crud_registration.model.real_name.ilike(f"%{keyword}%"),
                    crud_registration.model.phone.ilike(f"%{keyword}%"),
                    crud_registration.model.registration_no.ilike(f"%{keyword}%"),
                )
            )
        total = query.count()
        items = query.order_by(crud_registration.model.created_at.desc()).offset(skip).limit(page_size).all()
    return {"total": total, "items": items}


@router.get("/{registration_id}", response_model=RegistrationDetailResponse)
def get_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    registration = crud_registration.get(db, id=registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    
    checkin_count = len(registration.checkins)
    quality_histories = [
        {
            "id": h.id,
            "old_quality": h.old_quality,
            "new_quality": h.new_quality,
            "changed_by": h.changed_by,
            "reason": h.reason,
            "created_at": h.created_at,
        }
        for h in registration.quality_histories
    ]
    
    result = {
        c.name: getattr(registration, c.name)
        for c in registration.__table__.columns
    }
    result["event"] = {
        "id": registration.event.id,
        "name": registration.event.name,
        "location": registration.event.location,
        "start_date": registration.event.start_date,
    } if registration.event else None
    result["checkin_count"] = checkin_count
    result["quality_histories"] = quality_histories
    
    return result


@router.get("/no/{registration_no}", response_model=RegistrationResponse)
def get_registration_by_no(
    registration_no: str,
    db: Session = Depends(get_db),
):
    registration = crud_registration.get_by_registration_no(db, registration_no=registration_no)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    return registration


@router.post("", response_model=RegistrationResponse)
def create_registration(
    registration_in: RegistrationCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    event = crud_event.get(db, id=registration_in.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    if not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="活动已关闭",
        )
    
    registration = crud_registration.create(db, obj_in=registration_in)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CREATE,
        registration_id=registration.id,
        target_type="registration",
        target_id=registration.id,
        new_value={"real_name": registration.real_name, "phone": registration.phone},
        remark="用户提交报名",
        ip_address=get_client_ip(request),
    )
    
    return registration


@router.put("/{registration_id}", response_model=RegistrationResponse)
def update_registration(
    registration_id: int,
    registration_in: RegistrationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    registration = crud_registration.get(db, id=registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    
    old_data = {c.name: getattr(registration, c.name) for c in registration.__table__.columns}
    registration = crud_registration.update(db, db_obj=registration, obj_in=registration_in)
    
    update_data = registration_in.model_dump(exclude_unset=True)
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="registration",
        target_id=registration.id,
        old_value=old_data,
        new_value=update_data,
        remark="更新报名信息",
        ip_address=get_client_ip(request),
    )
    
    return registration


@router.post("/{registration_id}/quality", response_model=RegistrationResponse)
def update_quality(
    registration_id: int,
    quality_in: RegistrationQualityUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    registration = crud_registration.get(db, id=registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    
    registration = crud_registration.update_quality(
        db,
        db_obj=registration,
        new_quality=quality_in.quality,
        reason=quality_in.reason,
        changed_by=current_user.full_name or current_user.username,
    )
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.QUALITY_CHANGE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="registration",
        target_id=registration.id,
        old_value={"quality": registration.quality},
        new_value={"quality": quality_in.quality},
        remark=quality_in.reason or "调整报名质量",
        ip_address=get_client_ip(request),
    )
    
    return registration


class MarkRefundExceptionIn(BaseModel):
    description: Optional[str] = None
    refund_amount: int = 0


@router.post("/{registration_id}/mark-refund-exception")
def mark_refund_exception(
    registration_id: int,
    body: MarkRefundExceptionIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    registration = crud_registration.get(db, id=registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    if registration.status == RegistrationStatus.REFUND_EXCEPTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该报名已处于退票异常状态",
        )
    if registration.status == RegistrationStatus.REFUNDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该报名已退款完成",
        )
    if registration.status == RegistrationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该报名已取消",
        )
    
    old_status = registration.status
    registration.status = RegistrationStatus.REFUND_EXCEPTION
    db.add(registration)
    
    exception = crud_refund_exception.create_auto(
        db,
        registration_id=registration.id,
        description=body.description or f"运营人员手动标记退票异常 - {registration.real_name}",
        refund_amount=body.refund_amount or registration.ticket_price,
    )
    
    todo_data = TodoCreate(
        title=f"退票异常处理 - {registration.real_name}",
        description=body.description or f"运营人员手动标记退票异常\n报名编号：{registration.registration_no}",
        priority=TodoPriority.HIGH,
        todo_type=TodoType.REFUND_EXCEPTION,
        registration_id=registration.id,
    )
    todo = crud_todo.create_with_creator(db, obj_in=todo_data, created_by_id=current_user.id)
    todo.refund_exception_id = exception.id
    db.commit()
    db.refresh(registration)
    db.refresh(todo)
    db.refresh(exception)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.STATUS_CHANGE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="registration",
        target_id=registration.id,
        old_value={"status": old_status.value if old_status else None},
        new_value={"status": RegistrationStatus.REFUND_EXCEPTION.value},
        remark=body.description or "手动标记退票异常，已自动生成待办",
        ip_address=get_client_ip(request),
    )
    
    return {
        "message": "已标记为退票异常，并自动生成待办事项",
        "registration_id": registration.id,
        "registration_status": registration.status.value,
        "exception_id": exception.id,
        "todo_id": todo.id,
    }
