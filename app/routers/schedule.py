from datetime import date, datetime, time, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Schedule, Doctor, TimeSlot, TechnicianLeave
from app.schemas import (
    ScheduleCreate, Schedule as ScheduleSchema,
    Doctor as DoctorSchema, DoctorCreate,
    TimeSlot as TimeSlotSchema,
    TechnicianLeaveCreate, TechnicianLeave as TechnicianLeaveSchema
)

router = APIRouter()


@router.get("/doctors", response_model=List[DoctorSchema])
def get_doctors(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor)
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    return query.order_by(Doctor.id).all()


@router.post("/doctors", response_model=DoctorSchema)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


@router.get("/leaves", response_model=List[TechnicianLeaveSchema])
def get_leaves(
    doctor_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    operator: Optional[str] = None,
    leave_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TechnicianLeave)
    if doctor_id:
        query = query.filter(TechnicianLeave.doctor_id == doctor_id)
    if start_date:
        query = query.filter(TechnicianLeave.leave_date >= start_date)
    if end_date:
        query = query.filter(TechnicianLeave.leave_date <= end_date)
    if status:
        query = query.filter(TechnicianLeave.status == status)
    if operator:
        query = query.filter(TechnicianLeave.operator == operator)
    if leave_type:
        query = query.filter(TechnicianLeave.leave_type == leave_type)
    return query.order_by(TechnicianLeave.leave_date.desc()).all()


@router.post("/leaves", response_model=TechnicianLeaveSchema)
def create_leave(leave: TechnicianLeaveCreate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == leave.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")

    existing = db.query(TechnicianLeave).filter(
        TechnicianLeave.doctor_id == leave.doctor_id,
        TechnicianLeave.leave_date == leave.leave_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该医生当日已有请假记录")

    db_leave = TechnicianLeave(**leave.model_dump())
    db.add(db_leave)

    schedules = db.query(Schedule).filter(
        Schedule.doctor_id == leave.doctor_id,
        Schedule.schedule_date == leave.leave_date
    ).all()
    for schedule in schedules:
        schedule.status = "inactive"

    db.commit()
    db.refresh(db_leave)
    return db_leave


@router.post("/leaves/{leave_id}/cancel")
def cancel_leave(
    leave_id: int,
    operator: Optional[str] = "前台",
    db: Session = Depends(get_db)
):
    leave = db.query(TechnicianLeave).filter(TechnicianLeave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="请假记录不存在")
    if leave.status != "approved":
        raise HTTPException(status_code=400, detail="该请假已取消")

    leave.status = "cancelled"

    schedules = db.query(Schedule).filter(
        Schedule.doctor_id == leave.doctor_id,
        Schedule.schedule_date == leave.leave_date
    ).all()
    for schedule in schedules:
        schedule.status = "active"

    db.commit()
    return {"status": "success", "message": "请假已取消"}


@router.get("", response_model=List[ScheduleSchema])
def get_schedules(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Schedule)
    if start_date:
        query = query.filter(Schedule.schedule_date >= start_date)
    if end_date:
        query = query.filter(Schedule.schedule_date <= end_date)
    if doctor_id:
        query = query.filter(Schedule.doctor_id == doctor_id)
    if status:
        query = query.filter(Schedule.status == status)
    return query.order_by(Schedule.schedule_date, Schedule.start_time).all()


@router.post("", response_model=ScheduleSchema)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == schedule.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")

    existing = db.query(Schedule).filter(
        Schedule.doctor_id == schedule.doctor_id,
        Schedule.schedule_date == schedule.schedule_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该医生当日已有排班")

    leave = db.query(TechnicianLeave).filter(
        TechnicianLeave.doctor_id == schedule.doctor_id,
        TechnicianLeave.leave_date == schedule.schedule_date,
        TechnicianLeave.status == "approved"
    ).first()
    if leave:
        raise HTTPException(status_code=400, detail="该医生当日已请假")

    db_schedule = Schedule(**schedule.model_dump())
    db.add(db_schedule)
    db.flush()

    start_dt = datetime.combine(schedule.schedule_date, schedule.start_time)
    end_dt = datetime.combine(schedule.schedule_date, schedule.end_time)
    total_seconds = (end_dt - start_dt).total_seconds()
    slot_seconds = total_seconds / schedule.total_slots

    for i in range(schedule.total_slots):
        slot_start = start_dt + timedelta(seconds=slot_seconds * i)
        slot_end = start_dt + timedelta(seconds=slot_seconds * (i + 1))
        time_slot = TimeSlot(
            schedule_id=db_schedule.id,
            start_time=slot_start.time(),
            end_time=slot_end.time()
        )
        db.add(time_slot)

    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.get("/{schedule_id}", response_model=ScheduleSchema)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="排班不存在")
    return schedule


@router.get("/{schedule_id}/slots", response_model=List[TimeSlotSchema])
def get_schedule_slots(schedule_id: int, db: Session = Depends(get_db)):
    slots = db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule_id).order_by(TimeSlot.start_time).all()
    return slots


@router.put("/{schedule_id}/status")
def update_schedule_status(
    schedule_id: int,
    status: str = Query(...),
    db: Session = Depends(get_db)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="排班不存在")
    schedule.status = status
    db.commit()
    return {"status": "success", "message": "状态更新成功"}


@router.post("/{schedule_id}/slots/{slot_id}/lock")
def lock_time_slot(schedule_id: int, slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id, TimeSlot.schedule_id == schedule_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    if slot.is_booked:
        raise HTTPException(status_code=400, detail="已预约时段无法锁定")
    slot.is_locked = not slot.is_locked
    db.commit()
    return {"status": "success", "is_locked": slot.is_locked}
