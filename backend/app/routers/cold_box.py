import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cold_box import ColdBox, ColdBoxAlert, ReviewTask
from app.schemas.cold_box import (
    ColdBoxOut,
    ColdBoxTempUpdate,
    ColdBoxAlertOut,
    ReviewTaskOut,
    ReviewTaskComplete,
)
from app.services.cold_box_monitor import (
    update_cold_box_temp,
    resolve_cold_box_alert,
    complete_review_task,
    get_abnormal_cold_boxes,
)

router = APIRouter(prefix="/api/cold-boxes", tags=["cold-boxes"])


@router.get("/", response_model=list[ColdBoxOut])
def list_cold_boxes(route_id: uuid.UUID | None = None, db: Session = Depends(get_db)):
    query = db.query(ColdBox)
    if route_id:
        query = query.filter(ColdBox.route_id == route_id)
    return query.all()


@router.get("/abnormal", response_model=list[ColdBoxOut])
def list_abnormal(route_id: uuid.UUID | None = None, db: Session = Depends(get_db)):
    return get_abnormal_cold_boxes(db, route_id)


@router.put("/{cold_box_id}/temperature", response_model=ColdBoxOut)
def update_temperature(
    cold_box_id: uuid.UUID, data: ColdBoxTempUpdate, db: Session = Depends(get_db)
):
    try:
        return update_cold_box_temp(db, cold_box_id, data.temperature)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{cold_box_id}/alerts", response_model=list[ColdBoxAlertOut])
def get_alerts(cold_box_id: uuid.UUID, db: Session = Depends(get_db)):
    alerts = (
        db.query(ColdBoxAlert)
        .filter(ColdBoxAlert.cold_box_id == cold_box_id)
        .order_by(ColdBoxAlert.created_at.desc())
        .all()
    )
    return alerts


@router.put("/alerts/{alert_id}/resolve", response_model=ColdBoxAlertOut)
def resolve_alert(alert_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        return resolve_cold_box_alert(db, alert_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/review-tasks", response_model=list[ReviewTaskOut])
def list_review_tasks(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(ReviewTask)
    if status:
        query = query.filter(ReviewTask.status == status)
    return query.all()


@router.put("/review-tasks/{task_id}/complete", response_model=ReviewTaskOut)
def complete_task(
    task_id: uuid.UUID, data: ReviewTaskComplete, db: Session = Depends(get_db)
):
    try:
        return complete_review_task(db, task_id, data.result, data.assigned_to)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
