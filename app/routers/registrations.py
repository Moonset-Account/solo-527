from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from app.models import RegistrationStatus, ScheduleStatus
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/registrations", tags=["患者登记"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER
])


def generate_registration_number():
    return f"REG{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


@router.get("", response_model=List[schemas.RegistrationResponse])
def get_registrations(
    skip: int = 0,
    limit: int = 100,
    schedule_id: int = Query(None),
    status: RegistrationStatus = Query(None),
    phone: str = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.Registration)
    if schedule_id:
        query = query.filter(models.Registration.schedule_id == schedule_id)
    if status:
        query = query.filter(models.Registration.status == status)
    if phone:
        query = query.filter(models.Registration.patient_phone.contains(phone))
    return query.order_by(models.Registration.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{registration_id}", response_model=schemas.RegistrationResponse)
def get_registration(registration_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_reg = crud.registration.get(db, id=registration_id)
    if db_reg is None:
        raise HTTPException(status_code=404, detail="登记不存在")
    return db_reg


@router.post("", response_model=schemas.RegistrationResponse)
def create_registration(
    reg_in: schemas.RegistrationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    schedule = crud.schedule.get(db, id=reg_in.schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="排班不存在")
    if schedule.status not in [ScheduleStatus.PUBLISHED, ScheduleStatus.CONFIRMED, ScheduleStatus.IN_PROGRESS]:
        raise HTTPException(status_code=400, detail="排班未开放登记")
    
    current_count = db.query(models.Registration).filter(
        models.Registration.schedule_id == reg_in.schedule_id,
        models.Registration.status.in_([
            RegistrationStatus.PENDING,
            RegistrationStatus.QUALIFIED,
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.CHECKED_IN
        ])
    ).count()
    if current_count >= schedule.max_patients:
        raise HTTPException(status_code=400, detail="该排班名额已满")
    
    if reg_in.patient_phone:
        duplicate = db.query(models.Registration).filter(
            models.Registration.schedule_id == reg_in.schedule_id,
            models.Registration.patient_phone == reg_in.patient_phone,
            models.Registration.status.in_([
                RegistrationStatus.PENDING,
                RegistrationStatus.QUALIFIED,
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.CHECKED_IN,
                RegistrationStatus.SERVICED
            ])
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="该手机号在同一排班已登记，请勿重复报名")
    
    queue_number = crud.registration.get_next_queue_number(db, schedule_id=reg_in.schedule_id)
    
    reg_data = reg_in.model_dump()
    reg_data.update({
        "registration_number": generate_registration_number(),
        "queue_number": queue_number,
        "status": RegistrationStatus.PENDING,
        "created_by": current_user.id
    })
    
    db_reg = models.Registration(**reg_data)
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    return db_reg


@router.post("/{registration_id}/review", response_model=schemas.RegistrationResponse, dependencies=[Depends(allow_admin_coordinator)])
def review_registration(
    registration_id: int,
    review_data: schemas.RegistrationReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_reg = crud.registration.get(db, id=registration_id)
    if db_reg is None:
        raise HTTPException(status_code=404, detail="登记不存在")
    if db_reg.status != RegistrationStatus.PENDING:
        raise HTTPException(status_code=400, detail="当前状态无法审核")
    
    db_reg.is_eligible = review_data.is_eligible
    db_reg.eligibility_reason = review_data.eligibility_reason
    db_reg.status = RegistrationStatus.QUALIFIED if review_data.is_eligible else RegistrationStatus.REJECTED
    db_reg.reviewed_by = current_user.id
    db_reg.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_reg)
    return db_reg


@router.post("/{registration_id}/confirm", response_model=schemas.RegistrationResponse, dependencies=[Depends(allow_admin_coordinator)])
def confirm_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_reg = crud.registration.get(db, id=registration_id)
    if db_reg is None:
        raise HTTPException(status_code=404, detail="登记不存在")
    if db_reg.status != RegistrationStatus.QUALIFIED:
        raise HTTPException(status_code=400, detail="请先通过资格审核")
    
    db_reg.status = RegistrationStatus.CONFIRMED
    db_reg.confirmed_by = current_user.id
    db_reg.confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_reg)
    return db_reg


@router.put("/{registration_id}", response_model=schemas.RegistrationResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_registration(
    registration_id: int,
    reg_in: schemas.RegistrationUpdate,
    db: Session = Depends(get_db)
):
    db_reg = crud.registration.get(db, id=registration_id)
    if db_reg is None:
        raise HTTPException(status_code=404, detail="登记不存在")
    return crud.registration.update(db, db_obj=db_reg, obj_in=reg_in)


@router.delete("/{registration_id}", dependencies=[Depends(allow_admin_coordinator)])
def cancel_registration(registration_id: int, db: Session = Depends(get_db)):
    db_reg = crud.registration.get(db, id=registration_id)
    if db_reg is None:
        raise HTTPException(status_code=404, detail="登记不存在")
    db_reg.status = RegistrationStatus.CANCELLED
    db.commit()
    return {"message": "登记已取消"}
