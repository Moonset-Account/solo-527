from datetime import date, timedelta, datetime, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Schedule, Doctor, TimeSlot
from app.schemas import ScheduleCreate, Schedule as ScheduleSchema, Doctor as DoctorSchema, DoctorCreate, TimeSlot as TimeSlotSchema

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
