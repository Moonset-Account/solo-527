from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas, auth, tasks
from ..database import get_db

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("/", response_model=List[schemas.ActivityResponse])
def list_activities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    activities = db.query(models.Activity).filter(
        models.Activity.is_published == True
    ).offset(skip).limit(limit).all()
    return activities


@router.post("/", response_model=schemas.ActivityResponse)
def create_activity(
    activity: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    db_activity = models.Activity(
        **activity.model_dump(),
        created_by=current_user.id
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


@router.get("/{activity_id}", response_model=schemas.ActivityResponse)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.post("/{activity_id}/publish", response_model=schemas.ActivityResponse)
def publish_activity(
    activity_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity.is_published = True
    db.commit()
    db.refresh(activity)

    runners = db.query(models.User).filter(
        models.User.role == models.UserRole.RUNNER,
        models.User.is_active == True
    ).all()
    for runner in runners:
        notification = tasks.create_notification(
            db,
            runner.id,
            f"新活动发布: {activity.title}",
            f"教练发布了新活动「{activity.title}」，时间：{activity.activity_date.strftime('%Y-%m-%d %H:%M')}，快来报名吧！",
            notification_type="activity"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    return activity


@router.post("/{activity_id}/signup", response_model=schemas.ActivitySignupResponse)
def signup_activity(
    activity_id: int,
    signup_data: schemas.ActivitySignupCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if not activity.is_published:
        raise HTTPException(status_code=400, detail="Activity not open for signup")

    existing = db.query(models.ActivitySignup).filter(
        models.ActivitySignup.activity_id == activity_id,
        models.ActivitySignup.runner_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already signed up for this activity")

    if activity.registration_deadline and datetime.utcnow() > activity.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline passed")

    db_signup = models.ActivitySignup(
        activity_id=activity_id,
        runner_id=current_user.id,
        emergency_contact=signup_data.emergency_contact,
        emergency_phone=signup_data.emergency_phone
    )
    db.add(db_signup)
    db.commit()
    db.refresh(db_signup)

    tasks.create_task_for_activity_signup(db_signup, db)

    coaches = db.query(models.User).filter(
        models.User.role.in_([models.UserRole.ADMIN, models.UserRole.COACH])
    ).all()
    for coach in coaches:
        notification = tasks.create_notification(
            db,
            coach.id,
            f"活动报名待确认: {current_user.full_name or current_user.username}",
            f"{current_user.full_name or current_user.username}报名了活动「{activity.title}」，请确认。",
            notification_type="activity"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    return db_signup


@router.get("/{activity_id}/signups", response_model=List[schemas.ActivitySignupResponse])
def list_activity_signups(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    signups = db.query(models.ActivitySignup).filter(
        models.ActivitySignup.activity_id == activity_id
    ).all()
    return signups


@router.patch("/signups/{signup_id}", response_model=schemas.ActivitySignupResponse)
def update_signup_status(
    signup_id: int,
    update: schemas.ActivitySignupUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    signup = db.query(models.ActivitySignup).filter(models.ActivitySignup.id == signup_id).first()
    if not signup:
        raise HTTPException(status_code=404, detail="Signup not found")
    if update.status:
        signup.status = update.status
    db.commit()
    db.refresh(signup)

    activity = db.query(models.Activity).filter(models.Activity.id == signup.activity_id).first()

    if update.status == models.TaskStatus.ARCHIVED:
        notification = tasks.create_notification(
            db,
            signup.runner_id,
            f"活动报名已确认: {activity.title if activity else ''}",
            f"您的活动报名已通过教练确认，请准时参加。",
            notification_type="activity"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)
    elif update.status == models.TaskStatus.EXCEPTION_REVIEW:
        notification = tasks.create_notification(
            db,
            signup.runner_id,
            f"活动报名需要复核: {activity.title if activity else ''}",
            f"您的活动报名需要进一步信息，请联系教练。",
            notification_type="activity"
        )
        background_tasks.add_task(tasks.process_notification, notification.id)

    return signup


@router.get("/my-signups", response_model=List[schemas.ActivitySignupResponse])
def get_my_signups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    signups = db.query(models.ActivitySignup).filter(
        models.ActivitySignup.runner_id == current_user.id
    ).all()
    return signups
