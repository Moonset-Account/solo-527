from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, tasks
from ..database import get_db

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.get("/", response_model=List[schemas.CheckinResponse])
def list_checkins(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    if current_user.role in [models.UserRole.ADMIN, models.UserRole.COACH]:
        checkins = db.query(models.Checkin).offset(skip).limit(limit).all()
    else:
        checkins = db.query(models.Checkin).filter(
            models.Checkin.runner_id == current_user.id
        ).offset(skip).limit(limit).all()
    return checkins


@router.post("/", response_model=schemas.CheckinResponse)
def create_checkin(
    checkin: schemas.CheckinCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    db_checkin = models.Checkin(
        **checkin.model_dump(exclude={"track_points"}),
        runner_id=current_user.id
    )
    if checkin.track_points:
        masked_points = []
        for pt in checkin.track_points:
            masked_pt = {
                "lat": round(pt.get("lat", 0), 2),
                "lng": round(pt.get("lng", 0), 2)
            }
            masked_points.append(masked_pt)
        db_checkin.track_points = masked_points

    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)

    tasks.create_task_for_checkin(db_checkin, db)

    coaches = db.query(models.User).filter(
        models.User.role.in_([models.UserRole.ADMIN, models.UserRole.COACH])
    ).all()
    for coach in coaches:
        notification = tasks.create_notification(
            db,
            coach.id,
            f"新打卡待确认: {current_user.full_name or current_user.username}",
            f"{current_user.full_name or current_user.username}提交了{checkin.distance_km}公里打卡，请审核。",
            notification_type="checkin"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    return db_checkin


@router.get("/{checkin_id}", response_model=schemas.CheckinResponse)
def get_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    checkin = db.query(models.Checkin).filter(models.Checkin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin not found")
    if current_user.role == models.UserRole.RUNNER and checkin.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this checkin")
    return checkin


@router.patch("/{checkin_id}", response_model=schemas.CheckinResponse)
def update_checkin(
    checkin_id: int,
    checkin_update: schemas.CheckinUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    checkin = db.query(models.Checkin).filter(models.Checkin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin not found")
    for key, value in checkin_update.model_dump(exclude_unset=True).items():
        setattr(checkin, key, value)
    db.commit()
    db.refresh(checkin)

    if checkin_update.status == models.TaskStatus.EXCEPTION_REVIEW:
        notification = tasks.create_notification(
            db,
            checkin.runner_id,
            "打卡数据需要复核",
            f"您的打卡记录需要进一步复核，请准备相关证明材料。",
            notification_type="checkin"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    if checkin_update.status == models.TaskStatus.ARCHIVED:
        notification = tasks.create_notification(
            db,
            checkin.runner_id,
            "打卡已通过审核",
            f"您的{checkin.distance_km}公里打卡已通过教练审核。",
            notification_type="checkin"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    return checkin
