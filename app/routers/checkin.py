from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Appointment, CheckIn, Schedule, TimeSlot, ProcessLog
from app.schemas import CheckInCreate, CheckIn as CheckInSchema

router = APIRouter()


@router.post("/checkin")
def check_in(
    appointment_id: int,
    operator: Optional[str] = "前台",
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")

    existing_checkin = db.query(CheckIn).filter(CheckIn.appointment_id == appointment_id).first()
    if existing_checkin:
        raise HTTPException(status_code=400, detail="该预约已核销")

    if appointment.status not in ["pending"]:
        raise HTTPException(status_code=400, detail="当前状态无法核销")

    checkin = CheckIn(
        appointment_id=appointment_id,
        checkin_time=datetime.now(),
        is_no_show=False,
        operator=operator
    )
    db.add(checkin)

    appointment.status = "checked_in"

    process_log = ProcessLog(
        appointment_id=appointment.id,
        action="到店核销",
        operator=operator,
        detail=f"患者到店核销成功"
    )
    db.add(process_log)

    db.commit()
    db.refresh(checkin)
    return {"status": "success", "message": "核销成功", "checkin": checkin}


@router.post("/noshow")
def mark_no_show(
    appointment_id: int,
    operator: Optional[str] = "前台",
    remark: Optional[str] = None,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")

    existing_checkin = db.query(CheckIn).filter(CheckIn.appointment_id == appointment_id).first()
    if existing_checkin:
        raise HTTPException(status_code=400, detail="该预约已有核销记录")

    if appointment.status not in ["pending"]:
        raise HTTPException(status_code=400, detail="当前状态无法标记爽约")

    checkin = CheckIn(
        appointment_id=appointment_id,
        checkin_time=None,
        is_no_show=True,
        operator=operator,
        remark=remark
    )
    db.add(checkin)

    appointment.status = "no_show"

    time_slot = db.query(TimeSlot).filter(TimeSlot.id == appointment.time_slot_id).first()
    if time_slot:
        time_slot.is_booked = False

    schedule = db.query(Schedule).filter(Schedule.id == appointment.schedule_id).first()
    if schedule and schedule.booked_slots > 0:
        schedule.booked_slots -= 1

    process_log = ProcessLog(
        appointment_id=appointment.id,
        action="标记爽约",
        operator=operator,
        detail=remark or "患者未到店，标记爽约"
    )
    db.add(process_log)

    db.commit()
    return {"status": "success", "message": "已标记爽约"}


@router.get("/records", response_model=List[CheckInSchema])
def get_checkin_records(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    operator: Optional[str] = None,
    is_no_show: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CheckIn)
    if start_date:
        query = query.filter(CheckIn.created_at >= start_date)
    if end_date:
        query = query.filter(CheckIn.created_at <= end_date + " 23:59:59")
    if operator:
        query = query.filter(CheckIn.operator == operator)
    if is_no_show is not None:
        query = query.filter(CheckIn.is_no_show == is_no_show)
    return query.order_by(CheckIn.created_at.desc()).all()


@router.get("/appointment/{appointment_id}")
def get_checkin_by_appointment(appointment_id: int, db: Session = Depends(get_db)):
    checkin = db.query(CheckIn).filter(CheckIn.appointment_id == appointment_id).first()
    if not checkin:
        return None
    return checkin
