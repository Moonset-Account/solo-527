from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from app.models import ScheduleStatus, ScheduleVolunteer

router = APIRouter(prefix="/api/schedules", tags=["排班管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER
])


@router.get("", response_model=List[schemas.ScheduleResponse])
def get_schedules(
    skip: int = 0,
    limit: int = 100,
    doctor_id: int = Query(None),
    location_id: int = Query(None),
    start_date: date = Query(None),
    end_date: date = Query(None),
    status: ScheduleStatus = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.Schedule)
    if doctor_id:
        query = query.filter(models.Schedule.doctor_id == doctor_id)
    if location_id:
        query = query.filter(models.Schedule.location_id == location_id)
    if start_date:
        query = query.filter(models.Schedule.date >= start_date)
    if end_date:
        query = query.filter(models.Schedule.date <= end_date)
    if status:
        query = query.filter(models.Schedule.status == status)
    return query.offset(skip).limit(limit).all()


@router.get("/{schedule_id}", response_model=schemas.ScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    return db_schedule


@router.post("", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_schedule(schedule_in: schemas.ScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    schedule_data = schedule_in.model_dump(exclude={"volunteer_ids"})
    schedule_data["created_by"] = current_user.id
    db_schedule = models.Schedule(**schedule_data)
    db.add(db_schedule)
    db.flush()

    for volunteer_id in schedule_in.volunteer_ids:
        sv = ScheduleVolunteer(schedule_id=db_schedule.id, volunteer_id=volunteer_id)
        db.add(sv)

    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.put("/{schedule_id}", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_schedule(schedule_id: int, schedule_in: schemas.ScheduleUpdate, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    return crud.schedule.update(db, db_obj=db_schedule, obj_in=schedule_in)


@router.post("/{schedule_id}/confirm", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_admin_coordinator)])
def confirm_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from datetime import datetime
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    if db_schedule.status not in [ScheduleStatus.DRAFT, ScheduleStatus.PUBLISHED]:
        raise HTTPException(status_code=400, detail="当前状态无法确认")
    
    db_schedule.status = ScheduleStatus.CONFIRMED
    db_schedule.confirmed_by = current_user.id
    db_schedule.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.post("/{schedule_id}/start", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_all_staff)])
def start_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    if db_schedule.status != ScheduleStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="排班未确认，无法开始")
    
    db_schedule.status = ScheduleStatus.IN_PROGRESS
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.post("/{schedule_id}/complete", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_all_staff)])
def complete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    if db_schedule.status != ScheduleStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="排班未进行中，无法完成")
    
    db_schedule.status = ScheduleStatus.COMPLETED
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.delete("/{schedule_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    crud.schedule.remove(db, id=schedule_id)
    return {"message": "排班已删除"}
