from typing import List
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from app.models import ScheduleStatus, ScheduleVolunteer
from app.tasks import schedule_reminder_task

router = APIRouter(prefix="/api/schedules", tags=["排班管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER
])


def parse_time(t):
    h, m = map(int, t.split(':'))
    return h * 60 + m


def check_schedule_conflict(db, schedule_date, start_time, end_time, doctor_id=None, location_id=None, volunteer_ids=None, exclude_schedule_id=None):
    conflicts = []
    start_min = parse_time(start_time)
    end_min = parse_time(end_time)
    
    query = db.query(models.Schedule).filter(
        models.Schedule.date == schedule_date,
        models.Schedule.status.in_([ScheduleStatus.DRAFT, ScheduleStatus.PUBLISHED, ScheduleStatus.CONFIRMED, ScheduleStatus.IN_PROGRESS])
    )
    if exclude_schedule_id:
        query = query.filter(models.Schedule.id != exclude_schedule_id)
    
    existing_schedules = query.all()
    
    for s in existing_schedules:
        s_start = parse_time(s.start_time)
        s_end = parse_time(s.end_time)
        overlap = (start_min < s_end) and (end_min > s_start)
        if not overlap:
            continue
        
        if doctor_id and s.doctor_id == doctor_id:
            conflicts.append(f"医生在 {s.date} {s.start_time}-{s.end_time} 已有排班：{s.title}")
        
        if location_id and s.location_id == location_id:
            conflicts.append(f"地点在 {s.date} {s.start_time}-{s.end_time} 已有排班：{s.title}")
        
        if volunteer_ids:
            s_volunteer_ids = [sv.volunteer_id for sv in s.volunteers]
            overlapping = set(volunteer_ids) & set(s_volunteer_ids)
            if overlapping:
                conflicts.append(f"志愿者ID {list(overlapping)} 在 {s.date} {s.start_time}-{s.end_time} 已有排班：{s.title}")
    
    return conflicts


@router.get("/check-conflict")
def check_conflict(
    schedule_date: date,
    start_time: str,
    end_time: str,
    doctor_id: int = Query(None),
    location_id: int = Query(None),
    volunteer_ids: str = Query(None, description="逗号分隔的志愿者ID列表"),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    vid_list = []
    if volunteer_ids:
        vid_list = [int(x.strip()) for x in volunteer_ids.split(',') if x.strip()]
    conflicts = check_schedule_conflict(db, schedule_date, start_time, end_time, doctor_id, location_id, vid_list)
    return {"has_conflict": len(conflicts) > 0, "conflicts": conflicts}


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
    return query.order_by(models.Schedule.date.desc()).offset(skip).limit(limit).all()


@router.get("/{schedule_id}", response_model=schemas.ScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    return db_schedule


@router.post("", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_schedule(schedule_in: schemas.ScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    conflicts = check_schedule_conflict(
        db,
        schedule_in.date,
        schedule_in.start_time,
        schedule_in.end_time,
        doctor_id=schedule_in.doctor_id,
        location_id=schedule_in.location_id,
        volunteer_ids=schedule_in.volunteer_ids
    )
    if conflicts:
        raise HTTPException(status_code=400, detail="排班冲突：" + "; ".join(conflicts))
    
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


@router.post("/{schedule_id}/send-reminder", response_model=dict, dependencies=[Depends(allow_admin_coordinator)])
def send_schedule_reminder(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    result = schedule_reminder_task.delay(schedule_id)
    return {"message": "提醒任务已提交", "task_id": result.id}


@router.put("/{schedule_id}", response_model=schemas.ScheduleResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_schedule(schedule_id: int, schedule_in: schemas.ScheduleUpdate, db: Session = Depends(get_db)):
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    
    update_data = schedule_in.model_dump(exclude_unset=True)
    
    new_date = update_data.get("date", db_schedule.date)
    new_start = update_data.get("start_time", db_schedule.start_time)
    new_end = update_data.get("end_time", db_schedule.end_time)
    new_doctor = update_data.get("doctor_id", db_schedule.doctor_id)
    new_location = update_data.get("location_id", db_schedule.location_id)
    
    current_volunteers = [sv.volunteer_id for sv in db_schedule.volunteers]
    
    conflicts = check_schedule_conflict(
        db,
        new_date,
        new_start,
        new_end,
        doctor_id=new_doctor,
        location_id=new_location,
        volunteer_ids=current_volunteers,
        exclude_schedule_id=schedule_id
    )
    if conflicts:
        raise HTTPException(status_code=400, detail="排班冲突：" + "; ".join(conflicts))
    
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
