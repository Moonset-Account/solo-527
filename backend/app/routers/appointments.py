from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional
from ..database import get_db
from ..models import Appointment, Schedule, Counselor, TimeSlot, User, NoShowList, AppointmentStatus
from ..schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from ..auth import get_current_user, get_current_active_dispatcher, log_operation, model_to_dict
import uuid

router = APIRouter(prefix="/api/appointments", tags=["预约管理"])


@router.get("", response_model=list[AppointmentResponse])
async def get_appointments(
    skip: int = 0,
    limit: int = 100,
    counselor_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[AppointmentStatus] = None,
    visitor_phone: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(Appointment).join(Schedule)
    
    if counselor_id:
        query = query.filter(Schedule.counselor_id == counselor_id)
    if start_date:
        query = query.filter(Schedule.schedule_date >= start_date)
    if end_date:
        query = query.filter(Schedule.schedule_date <= end_date)
    if status:
        query = query.filter(Appointment.status == status)
    if visitor_phone:
        query = query.filter(Appointment.visitor_phone == visitor_phone)
    
    appointments = query.order_by(Appointment.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for apt in appointments:
        creator = db.query(User).filter(User.id == apt.created_by).first()
        sched = db.query(Schedule).filter(Schedule.id == apt.schedule_id).first()
        counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first() if sched else None
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first() if sched else None
        
        apt_dict = model_to_dict(apt)
        apt_dict["creator_info"] = model_to_dict(creator) if creator else None
        
        schedule_dict = model_to_dict(sched) if sched else None
        if schedule_dict:
            schedule_dict["counselor_info"] = model_to_dict(counselor) if counselor else None
            schedule_dict["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
        apt_dict["schedule_info"] = schedule_dict
        
        result.append(apt_dict)
    
    return result


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预约不存在"
        )
    
    creator = db.query(User).filter(User.id == appointment.created_by).first()
    sched = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
    counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first() if sched else None
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first() if sched else None
    
    apt_dict = model_to_dict(appointment)
    apt_dict["creator_info"] = model_to_dict(creator) if creator else None
    
    schedule_dict = model_to_dict(sched) if sched else None
    if schedule_dict:
        schedule_dict["counselor_info"] = model_to_dict(counselor) if counselor else None
        schedule_dict["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
    apt_dict["schedule_info"] = schedule_dict
    
    return apt_dict


@router.post("", response_model=AppointmentResponse)
async def create_appointment(
    request: Request,
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    schedule = db.query(Schedule).filter(Schedule.id == appointment_data.schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在"
        )
    
    if not schedule.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该排班已不可用"
        )
    
    booked = db.query(Appointment).filter(
        Appointment.schedule_id == appointment_data.schedule_id,
        Appointment.status != "cancelled"
    ).count()
    
    if booked >= schedule.max_appointments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该档期已满"
        )
    
    no_show = db.query(NoShowList).filter(
        NoShowList.visitor_phone == appointment_data.visitor_phone,
        NoShowList.is_blocked == True
    ).first()
    
    if no_show:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该手机号在爽约名单中，爽约次数: {no_show.no_show_count}，暂无法预约"
        )
    
    last_operation = {
        "type": "create",
        "operator": current_user.real_name,
        "operator_id": current_user.id,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": request.client.host if request.client else None
    }
    
    new_appointment = Appointment(
        **appointment_data.model_dump(),
        created_by=current_user.id,
        last_operation=last_operation
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    log_operation(
        db, current_user.id, "create", "appointment", new_appointment.id,
        request=request,
        new_value=model_to_dict(new_appointment)
    )
    
    creator = db.query(User).filter(User.id == new_appointment.created_by).first()
    sched = db.query(Schedule).filter(Schedule.id == new_appointment.schedule_id).first()
    counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first() if sched else None
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first() if sched else None
    
    apt_dict = model_to_dict(new_appointment)
    apt_dict["creator_info"] = model_to_dict(creator) if creator else None
    
    schedule_dict = model_to_dict(sched) if sched else None
    if schedule_dict:
        schedule_dict["counselor_info"] = model_to_dict(counselor) if counselor else None
        schedule_dict["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
    apt_dict["schedule_info"] = schedule_dict
    
    return apt_dict


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    request: Request,
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预约不存在"
        )
    
    old_value = model_to_dict(appointment)
    
    last_operation = {
        "type": "update",
        "operator": current_user.real_name,
        "operator_id": current_user.id,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": request.client.host if request.client else None,
        "changes": appointment_data.model_dump(exclude_unset=True)
    }
    
    update_data = appointment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment, key, value)
    
    appointment.last_operation = last_operation
    db.commit()
    db.refresh(appointment)
    
    log_operation(
        db, current_user.id, "update", "appointment", appointment_id,
        request=request,
        old_value=old_value,
        new_value=model_to_dict(appointment)
    )
    
    creator = db.query(User).filter(User.id == appointment.created_by).first()
    sched = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
    counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first() if sched else None
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first() if sched else None
    
    apt_dict = model_to_dict(appointment)
    apt_dict["creator_info"] = model_to_dict(creator) if creator else None
    
    schedule_dict = model_to_dict(sched) if sched else None
    if schedule_dict:
        schedule_dict["counselor_info"] = model_to_dict(counselor) if counselor else None
        schedule_dict["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
    apt_dict["schedule_info"] = schedule_dict
    
    return apt_dict


@router.delete("/{appointment_id}")
async def cancel_appointment(
    request: Request,
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预约不存在"
        )
    
    old_value = model_to_dict(appointment)
    
    last_operation = {
        "type": "cancel",
        "operator": current_user.real_name,
        "operator_id": current_user.id,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": request.client.host if request.client else None
    }
    
    appointment.status = AppointmentStatus.CANCELLED
    appointment.last_operation = last_operation
    db.commit()
    
    log_operation(
        db, current_user.id, "cancel", "appointment", appointment_id,
        request=request,
        old_value=old_value,
        new_value={"status": "cancelled"}
    )
    
    return {"message": "预约已取消"}


@router.post("/{appointment_id}/mark-no-show")
async def mark_no_show(
    request: Request,
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预约不存在"
        )
    
    appointment.status = AppointmentStatus.NO_SHOW
    
    last_operation = {
        "type": "mark_no_show",
        "operator": current_user.real_name,
        "operator_id": current_user.id,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": request.client.host if request.client else None
    }
    appointment.last_operation = last_operation
    
    existing_no_show = db.query(NoShowList).filter(
        NoShowList.visitor_phone == appointment.visitor_phone
    ).first()
    
    if existing_no_show:
        existing_no_show.no_show_count += 1
        existing_no_show.is_blocked = True
        existing_no_show.updated_at = datetime.utcnow()
    else:
        new_no_show = NoShowList(
            visitor_phone=appointment.visitor_phone,
            visitor_name=appointment.visitor_name,
            reason="预约未到场",
            no_show_count=1,
            is_blocked=True,
            created_by=current_user.id
        )
        db.add(new_no_show)
    
    db.commit()
    
    log_operation(
        db, current_user.id, "mark_no_show", "appointment", appointment_id,
        request=request,
        new_value={"status": "no_show", "added_to_blacklist": True}
    )
    
    return {"message": "已标记为爽约，并加入爽约名单"}
