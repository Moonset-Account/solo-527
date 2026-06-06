from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from app.models import RegistrationStatus, ScheduleStatus
from datetime import datetime

router = APIRouter(tags=["现场服务"])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER
])


@router.post("/api/check-ins", response_model=schemas.CheckInResponse, dependencies=[Depends(allow_all_staff)])
def create_check_in(
    check_in: schemas.CheckInCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    registration = crud.registration.get(db, id=check_in.registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="登记不存在")
    if registration.schedule_id != check_in.schedule_id:
        raise HTTPException(status_code=400, detail="登记与排班不匹配")
    if registration.status != RegistrationStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="请先确认登记")
    
    existing = db.query(models.CheckIn).filter(
        models.CheckIn.registration_id == check_in.registration_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="已签到")
    
    db_check_in = models.CheckIn(
        **check_in.model_dump(),
        checked_in_by=current_user.id
    )
    db.add(db_check_in)
    
    registration.status = RegistrationStatus.CHECKED_IN
    db.commit()
    db.refresh(db_check_in)
    return db_check_in


@router.get("/api/schedules/{schedule_id}/check-ins", response_model=List[schemas.CheckInResponse])
def get_schedule_check_ins(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    return db.query(models.CheckIn).filter(
        models.CheckIn.schedule_id == schedule_id
    ).order_by(models.CheckIn.check_in_time).all()


@router.post("/api/service-records", response_model=schemas.ServiceRecordResponse, dependencies=[Depends(allow_all_staff)])
def create_service_record(
    record_in: schemas.ServiceRecordCreate,
    db: Session = Depends(get_db)
):
    registration = crud.registration.get(db, id=record_in.registration_id)
    if not registration:
        raise HTTPException(status_code=404, detail="登记不存在")
    if registration.status != RegistrationStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="患者未签到")
    
    existing = crud.service_record.get_by_registration(db, registration_id=record_in.registration_id)
    if existing:
        raise HTTPException(status_code=400, detail="服务记录已存在")
    
    record_data = record_in.model_dump(exclude={"prescriptions"})
    record_data["service_start_time"] = datetime.utcnow()
    db_record = models.ServiceRecord(**record_data)
    db.add(db_record)
    db.flush()

    for rx_in in record_in.prescriptions:
        rx = models.PrescriptionItem(
            service_record_id=db_record.id,
            medicine_name=rx_in.medicine_name,
            specification=rx_in.specification,
            quantity=rx_in.quantity,
            unit=rx_in.unit,
            dosage=rx_in.dosage,
            notes=rx_in.notes
        )
        db.add(rx)

    registration.status = RegistrationStatus.SERVICED
    db_record.service_end_time = datetime.utcnow()
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/api/schedules/{schedule_id}/service-records", response_model=List[schemas.ServiceRecordResponse])
def get_schedule_service_records(
    schedule_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    return crud.service_record.get_by_schedule(db, schedule_id=schedule_id)


@router.get("/api/service-records/{record_id}", response_model=schemas.ServiceRecordResponse)
def get_service_record(
    record_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    record = crud.service_record.get(db, id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="服务记录不存在")
    return record
