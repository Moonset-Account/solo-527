from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Waitlist, Doctor, Schedule, TimeSlot, Appointment
from app.schemas import WaitlistCreate, Waitlist as WaitlistSchema

router = APIRouter()


@router.get("", response_model=List[WaitlistSchema])
def get_waitlist(
    doctor_id: Optional[int] = None,
    target_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Waitlist)
    if doctor_id:
        query = query.filter(Waitlist.doctor_id == doctor_id)
    if target_date:
        query = query.filter(Waitlist.target_date == target_date)
    if status:
        query = query.filter(Waitlist.status == status)
    return query.order_by(Waitlist.priority.desc(), Waitlist.created_at).all()


@router.post("", response_model=WaitlistSchema)
def create_waitlist(waitlist: WaitlistCreate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == waitlist.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="医生不存在")

    db_waitlist = Waitlist(**waitlist.model_dump(), status="waiting")
    db.add(db_waitlist)
    db.commit()
    db.refresh(db_waitlist)
    return db_waitlist


@router.post("/{waitlist_id}/allocate")
def allocate_waitlist(
    waitlist_id: int,
    schedule_id: int,
    slot_id: int,
    operator: Optional[str] = "前台",
    db: Session = Depends(get_db)
):
    waitlist = db.query(Waitlist).filter(Waitlist.id == waitlist_id).first()
    if not waitlist:
        raise HTTPException(status_code=404, detail="候补记录不存在")
    if waitlist.status != "waiting":
        raise HTTPException(status_code=400, detail="该候补已处理")

    slot = db.query(TimeSlot).filter(
        TimeSlot.id == slot_id,
        TimeSlot.schedule_id == schedule_id
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="时段不存在")
    if slot.is_booked or slot.is_locked:
        raise HTTPException(status_code=400, detail="该时段不可用")

    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule or schedule.status != "active":
        raise HTTPException(status_code=400, detail="排班无效")

    import uuid
    appointment_no = f"APT{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"

    appointment = Appointment(
        appointment_no=appointment_no,
        patient_name=waitlist.patient_name,
        patient_phone=waitlist.patient_phone,
        doctor_id=waitlist.doctor_id,
        schedule_id=schedule_id,
        time_slot_id=slot_id,
        source=waitlist.source,
        service_type="洁牙",
        price=0,
        status="pending"
    )
    db.add(appointment)

    slot.is_booked = True
    schedule.booked_slots += 1

    waitlist.status = "allocated"
    waitlist.processed_at = datetime.now()
    waitlist.processed_by = operator

    db.commit()
    return {"status": "success", "message": "候补已分配", "appointment_no": appointment_no}


@router.post("/{waitlist_id}/cancel")
def cancel_waitlist(
    waitlist_id: int,
    operator: Optional[str] = "前台",
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    waitlist = db.query(Waitlist).filter(Waitlist.id == waitlist_id).first()
    if not waitlist:
        raise HTTPException(status_code=404, detail="候补记录不存在")
    if waitlist.status != "waiting":
        raise HTTPException(status_code=400, detail="该候补已处理")

    waitlist.status = "cancelled"
    waitlist.processed_at = datetime.now()
    waitlist.processed_by = operator
    waitlist.remark = reason or waitlist.remark

    db.commit()
    return {"status": "success", "message": "候补已取消"}
