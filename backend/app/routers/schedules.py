from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, timedelta
from typing import Optional
from ..database import get_db
from ..models import Schedule, Counselor, TimeSlot, User, Appointment
from ..schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse, TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse
from ..auth import get_current_user, get_current_active_dispatcher, log_operation, model_to_dict

router = APIRouter(tags=["排班管理"])


@router.get("/api/time-slots", response_model=list[TimeSlotResponse])
async def get_time_slots(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    day_of_week: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(TimeSlot)
    if is_active is not None:
        query = query.filter(TimeSlot.is_active == is_active)
    if day_of_week is not None:
        query = query.filter(TimeSlot.day_of_week == day_of_week)
    time_slots = query.offset(skip).limit(limit).all()
    return time_slots


@router.post("/api/time-slots", response_model=TimeSlotResponse)
async def create_time_slot(
    request: Request,
    time_slot_data: TimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    new_time_slot = TimeSlot(**time_slot_data.model_dump())
    db.add(new_time_slot)
    db.commit()
    db.refresh(new_time_slot)
    
    log_operation(
        db, current_user.id, "create", "time_slot", new_time_slot.id,
        request=request,
        new_value=model_to_dict(new_time_slot)
    )
    
    return new_time_slot


@router.put("/api/time-slots/{time_slot_id}", response_model=TimeSlotResponse)
async def update_time_slot(
    request: Request,
    time_slot_id: int,
    time_slot_data: TimeSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="时段不存在"
        )
    
    old_value = model_to_dict(time_slot)
    update_data = time_slot_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(time_slot, key, value)
    
    db.commit()
    db.refresh(time_slot)
    
    log_operation(
        db, current_user.id, "update", "time_slot", time_slot_id,
        request=request,
        old_value=old_value,
        new_value=model_to_dict(time_slot)
    )
    
    return time_slot


@router.get("/api/schedules", response_model=list[ScheduleResponse])
async def get_schedules(
    skip: int = 0,
    limit: int = 100,
    counselor_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(Schedule)
    
    if counselor_id:
        query = query.filter(Schedule.counselor_id == counselor_id)
    if start_date:
        query = query.filter(Schedule.schedule_date >= start_date)
    if end_date:
        query = query.filter(Schedule.schedule_date <= end_date)
    if is_available is not None:
        query = query.filter(Schedule.is_available == is_available)
    
    schedules = query.order_by(Schedule.schedule_date, Schedule.time_slot_id).offset(skip).limit(limit).all()
    
    result = []
    for sched in schedules:
        counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first()
        time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first()
        
        sched_dict = model_to_dict(sched)
        sched_dict["counselor_info"] = model_to_dict(counselor) if counselor else None
        sched_dict["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
        result.append(sched_dict)
    
    return result


@router.get("/api/schedules/available")
async def get_available_schedules(
    counselor_id: Optional[int] = None,
    schedule_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(Schedule).filter(Schedule.is_available == True)
    
    if counselor_id:
        query = query.filter(Schedule.counselor_id == counselor_id)
    if schedule_date:
        query = query.filter(Schedule.schedule_date == schedule_date)
    
    schedules = query.all()
    
    result = []
    for sched in schedules:
        booked = db.query(Appointment).filter(
            Appointment.schedule_id == sched.id,
            Appointment.status != "cancelled"
        ).count()
        
        if booked < sched.max_appointments:
            counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first()
            time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first()
            
            result.append({
                "id": sched.id,
                "counselor_id": sched.counselor_id,
                "counselor_name": counselor.name if counselor else None,
                "specialty": counselor.specialty if counselor else None,
                "title": counselor.title if counselor else None,
                "schedule_date": sched.schedule_date,
                "time_slot_id": sched.time_slot_id,
                "start_time": time_slot.start_time.isoformat() if time_slot else None,
                "end_time": time_slot.end_time.isoformat() if time_slot else None,
                "max_appointments": sched.max_appointments,
                "booked_count": booked,
                "available_slots": sched.max_appointments - booked
            })
    
    return result


@router.post("/api/schedules", response_model=ScheduleResponse)
async def create_schedule(
    request: Request,
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    existing = db.query(Schedule).filter(
        Schedule.counselor_id == schedule_data.counselor_id,
        Schedule.time_slot_id == schedule_data.time_slot_id,
        Schedule.schedule_date == schedule_data.schedule_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该咨询师在此时段已有排班"
        )
    
    new_schedule = Schedule(**schedule_data.model_dump())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    log_operation(
        db, current_user.id, "create", "schedule", new_schedule.id,
        request=request,
        new_value=model_to_dict(new_schedule)
    )
    
    counselor = db.query(Counselor).filter(Counselor.id == new_schedule.counselor_id).first()
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == new_schedule.time_slot_id).first()
    
    result = model_to_dict(new_schedule)
    result["counselor_info"] = model_to_dict(counselor) if counselor else None
    result["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
    
    return result


@router.put("/api/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    request: Request,
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在"
        )
    
    old_value = model_to_dict(schedule)
    update_data = schedule_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    log_operation(
        db, current_user.id, "update", "schedule", schedule_id,
        request=request,
        old_value=old_value,
        new_value=model_to_dict(schedule)
    )
    
    counselor = db.query(Counselor).filter(Counselor.id == schedule.counselor_id).first()
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == schedule.time_slot_id).first()
    
    result = model_to_dict(schedule)
    result["counselor_info"] = model_to_dict(counselor) if counselor else None
    result["time_slot_info"] = model_to_dict(time_slot) if time_slot else None
    
    return result


@router.delete("/api/schedules/{schedule_id}")
async def delete_schedule(
    request: Request,
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在"
        )
    
    appointments = db.query(Appointment).filter(
        Appointment.schedule_id == schedule_id,
        Appointment.status != "cancelled"
    ).count()
    
    if appointments > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该排班上已有 {appointments} 个有效预约，无法删除"
        )
    
    old_value = model_to_dict(schedule)
    db.delete(schedule)
    db.commit()
    
    log_operation(
        db, current_user.id, "delete", "schedule", schedule_id,
        request=request,
        old_value=old_value
    )
    
    return {"message": "排班已删除"}


@router.post("/api/schedules/batch-create")
async def batch_create_schedules(
    request: Request,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    counselor_ids = data.get("counselor_ids", [])
    time_slot_ids = data.get("time_slot_ids", [])
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    
    if not start_date or not end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供开始和结束日期"
        )
    
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    
    created_count = 0
    delta = timedelta(days=1)
    current = start
    
    while current <= end:
        for counselor_id in counselor_ids:
            for time_slot_id in time_slot_ids:
                existing = db.query(Schedule).filter(
                    Schedule.counselor_id == counselor_id,
                    Schedule.time_slot_id == time_slot_id,
                    Schedule.schedule_date == current
                ).first()
                
                if not existing:
                    new_schedule = Schedule(
                        counselor_id=counselor_id,
                        time_slot_id=time_slot_id,
                        schedule_date=current,
                        max_appointments=data.get("max_appointments", 1),
                        is_available=True
                    )
                    db.add(new_schedule)
                    created_count += 1
        
        current += delta
    
    db.commit()
    
    log_operation(
        db, current_user.id, "batch_create", "schedule",
        request=request,
        new_value={
            "counselor_ids": counselor_ids,
            "time_slot_ids": time_slot_ids,
            "start_date": start_date,
            "end_date": end_date,
            "created_count": created_count
        }
    )
    
    return {"message": f"批量创建了 {created_count} 条排班"}
