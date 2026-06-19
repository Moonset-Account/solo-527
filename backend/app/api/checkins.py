from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_client_ip
from app.schemas.checkin import (
    CheckInCreate, CheckInResponse, CheckInListResponse,
    CheckInByCode, AttendanceFeedbackUpdate
)
from app.crud import crud_checkin, crud_registration, crud_device, crud_operation_log
from app.models.user import User
from app.models.checkin import CheckInStatus, AttendanceFeedback
from app.models.registration import RegistrationStatus
from app.models.device import DeviceStatus
from app.models.operation_log import OperationType

router = APIRouter(prefix="/checkins", tags=["签到核销"])


@router.get("", response_model=CheckInListResponse)
def list_checkins(
    event_id: Optional[int] = None,
    status: Optional[CheckInStatus] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    if event_id:
        items, total = crud_checkin.get_multi_by_event(
            db, event_id=event_id, skip=skip, limit=page_size,
            status=status, date_from=date_from, date_to=date_to,
        )
    else:
        query = db.query(crud_checkin.model)
        if status:
            query = query.filter(crud_checkin.model.status == status)
        if date_from:
            query = query.filter(crud_checkin.model.checkin_time >= date_from)
        if date_to:
            query = query.filter(crud_checkin.model.checkin_time <= date_to)
        total = query.count()
        items = query.order_by(crud_checkin.model.checkin_time.desc()).offset(skip).limit(page_size).all()
    
    result_items = []
    for item in items:
        detail = crud_checkin.get_checkin_detail(db, checkin_id=item.id)
        if detail:
            result_items.append(detail)
    
    return {"total": total, "items": result_items}


@router.post("", response_model=CheckInResponse)
def create_checkin(
    checkin_in: CheckInCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    registration = crud_registration.get(db, id=checkin_in.registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    if registration.event_id != checkin_in.event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="报名记录与活动不匹配",
        )
    if registration.status != RegistrationStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"报名状态为{registration.status.value}，无法签到",
        )
    
    is_duplicate = crud_checkin.check_duplicate(
        db, registration_id=checkin_in.registration_id, event_id=checkin_in.event_id
    )
    if is_duplicate:
        checkin = crud_checkin.create_checkin(db, obj_in=checkin_in, operator_id=current_user.id)
        checkin.status = CheckInStatus.DUPLICATE
        db.commit()
        db.refresh(checkin)
    else:
        checkin = crud_checkin.create_checkin(db, obj_in=checkin_in, operator_id=current_user.id)
    
    if checkin_in.device_id:
        crud_device.update_checkin_stats(db, device_id=checkin_in.device_id, checkin_time=checkin.checkin_time)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CHECKIN,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="checkin",
        target_id=checkin.id,
        new_value={"status": checkin.status.value},
        remark=f"签到核销 - {checkin.status.value}",
        ip_address=get_client_ip(request),
    )
    
    result = crud_checkin.get_checkin_detail(db, checkin_id=checkin.id)
    return result


@router.post("/by-code", response_model=CheckInResponse)
def checkin_by_code(
    checkin_in: CheckInByCode,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    registration = crud_registration.get_by_registration_no(db, registration_no=checkin_in.registration_no)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名编号不存在",
        )
    if registration.status != RegistrationStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"报名状态为{registration.status.value}，无法签到",
        )
    
    is_duplicate = crud_checkin.check_duplicate(
        db, registration_id=registration.id, event_id=registration.event_id
    )
    
    checkin_data = CheckInCreate(
        event_id=registration.event_id,
        registration_id=registration.id,
        device_id=checkin_in.device_id,
        checkin_method=checkin_in.checkin_method or "code",
    )
    
    if is_duplicate:
        checkin = crud_checkin.create_checkin(db, obj_in=checkin_data, operator_id=current_user.id)
        checkin.status = CheckInStatus.DUPLICATE
        db.commit()
        db.refresh(checkin)
    else:
        checkin = crud_checkin.create_checkin(db, obj_in=checkin_data, operator_id=current_user.id)
    
    if checkin_in.device_id:
        crud_device.update_checkin_stats(db, device_id=checkin_in.device_id, checkin_time=checkin.checkin_time)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CHECKIN,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="checkin",
        target_id=checkin.id,
        new_value={"status": checkin.status.value},
        remark=f"扫码签到 - {checkin.status.value}",
        ip_address=get_client_ip(request),
    )
    
    result = crud_checkin.get_checkin_detail(db, checkin_id=checkin.id)
    return result


@router.get("/{checkin_id}", response_model=CheckInResponse)
def get_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = crud_checkin.get_checkin_detail(db, checkin_id=checkin_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="签到记录不存在",
        )
    return result


@router.put("/{checkin_id}/feedback", response_model=CheckInResponse)
def update_attendance_feedback(
    checkin_id: int,
    feedback_in: AttendanceFeedbackUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = crud_checkin.get(db, id=checkin_id)
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="签到记录不存在",
        )
    
    old_feedback = checkin.attendance_feedback
    checkin = crud_checkin.update_attendance_feedback(
        db, checkin_id=checkin_id, feedback=feedback_in.feedback, remark=feedback_in.remark
    )
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=checkin.registration_id,
        target_type="checkin",
        target_id=checkin_id,
        old_value={"attendance_feedback": old_feedback.value if old_feedback else None},
        new_value={"attendance_feedback": feedback_in.feedback.value},
        remark=feedback_in.remark or "更新到场反馈",
        ip_address=get_client_ip(request),
    )
    
    result = crud_checkin.get_checkin_detail(db, checkin_id=checkin_id)
    return result
