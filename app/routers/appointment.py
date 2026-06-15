import uuid
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Appointment, Doctor, Schedule, TimeSlot, ProcessLog
from app.schemas import AppointmentCreate, Appointment as AppointmentSchema
from app.redis_client import get_redis

router = APIRouter()


def generate_appointment_no():
    return f"APT{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"


@router.get("", response_model=List[AppointmentSchema])
def get_appointments(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    patient_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).join(Schedule)
    if start_date:
        query = query.filter(Schedule.schedule_date >= start_date)
    if end_date:
        query = query.filter(Schedule.schedule_date <= end_date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
    if source:
        query = query.filter(Appointment.source == source)
    if patient_name:
        query = query.filter(Appointment.patient_name.like(f"%{patient_name}%"))
    return query.order_by(Appointment.created_at.desc()).all()


@router.post("", response_model=AppointmentSchema)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    redis = get_redis()
    lock_key = f"lock:slot:{appointment.time_slot_id}"

    if not redis.set(lock_key, "1", ex=30, nx=True):
        raise HTTPException(status_code=409, detail="该时段正在被预约，请稍候重试")

    try:
        time_slot = db.query(TimeSlot).filter(
            TimeSlot.id == appointment.time_slot_id,
            TimeSlot.schedule_id == appointment.schedule_id
        ).with_for_update().first()

        if not time_slot:
            raise HTTPException(status_code=404, detail="时段不存在")
        if time_slot.is_booked or time_slot.is_locked:
            raise HTTPException(status_code=400, detail="该时段已被预约或锁定")

        schedule = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="排班不存在")
        if schedule.status != "active":
            raise HTTPException(status_code=400, detail="该排班已停诊")

        appointment_no = generate_appointment_no()
        db_appointment = Appointment(
            **appointment.model_dump(),
            appointment_no=appointment_no,
            status="pending"
        )
        db.add(db_appointment)
        db.flush()

        time_slot.is_booked = True
        schedule.booked_slots += 1

        process_log = ProcessLog(
            appointment_id=db_appointment.id,
            action="预约创建",
            operator="system",
            detail=f"患者 {appointment.patient_name} 预约成功"
        )
        db.add(process_log)

        db.commit()
        db.refresh(db_appointment)
        return db_appointment
    finally:
        redis.delete(lock_key)


@router.get("/{appointment_id}", response_model=AppointmentSchema)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    return appointment


@router.get("/no/{appointment_no}", response_model=AppointmentSchema)
def get_appointment_by_no(appointment_no: str, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_no == appointment_no).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    return appointment


@router.put("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    operator: Optional[str] = "前台",
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    if appointment.status in ["checked_in", "cancelled", "no_show"]:
        raise HTTPException(status_code=400, detail="当前状态无法取消")

    time_slot = db.query(TimeSlot).filter(TimeSlot.id == appointment.time_slot_id).first()
    if time_slot:
        time_slot.is_booked = False

    schedule = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
    if schedule and schedule.booked_slots > 0:
        schedule.booked_slots -= 1

    appointment.status = "cancelled"

    process_log = ProcessLog(
        appointment_id=appointment.id,
        action="预约取消",
        operator=operator,
        detail=reason or "患者取消预约"
    )
    db.add(process_log)

    db.commit()
    return {"status": "success", "message": "预约已取消"}


@router.post("/{appointment_id}/reschedule")
def reschedule_appointment(
    appointment_id: int,
    new_schedule_id: int,
    new_slot_id: int,
    operator: Optional[str] = "前台",
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")
    if appointment.status != "pending":
        raise HTTPException(status_code=400, detail="仅待核销预约可改期")

    old_slot = db.query(TimeSlot).filter(TimeSlot.id == appointment.time_slot_id).first()
    new_slot = db.query(TimeSlot).filter(
        TimeSlot.id == new_slot_id,
        TimeSlot.schedule_id == new_schedule_id
    ).first()

    if not new_slot:
        raise HTTPException(status_code=404, detail="新时段不存在")
    if new_slot.is_booked or new_slot.is_locked:
        raise HTTPException(status_code=400, detail="新时段不可预约")

    new_schedule = db.query(Schedule).filter(Schedule.id == new_schedule_id).first()
    if not new_schedule or new_schedule.status != "active":
        raise HTTPException(status_code=400, detail="新排班无效")

    if old_slot:
        old_slot.is_booked = False
    old_schedule = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
    if old_schedule and old_schedule.booked_slots > 0:
        old_schedule.booked_slots -= 1

    new_slot.is_booked = True
    new_schedule.booked_slots += 1

    appointment.schedule_id = new_schedule_id
    appointment.time_slot_id = new_slot_id

    process_log = ProcessLog(
        appointment_id=appointment.id,
        action="预约改期",
        operator=operator,
        detail=f"改期到新时段"
    )
    db.add(process_log)

    db.commit()
    return {"status": "success", "message": "改期成功"}
