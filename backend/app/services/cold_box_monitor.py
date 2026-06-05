import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.config import settings
from app.models.cold_box import ColdBox, ColdBoxAlert, ReviewTask
from app.schemas.cold_box import ColdBoxAlertOut, ReviewTaskOut


def update_cold_box_temp(db: Session, cold_box_id: uuid.UUID, temperature: float) -> ColdBox:
    cold_box = db.query(ColdBox).filter(ColdBox.id == cold_box_id).first()
    if not cold_box:
        raise ValueError(f"ColdBox {cold_box_id} not found")

    cold_box.current_temp = temperature
    cold_box.last_checked_at = datetime.now()

    if temperature > settings.COLD_BOX_TEMP_THRESHOLD:
        cold_box.is_abnormal = True
        review_task = ReviewTask(
            task_type="cold_box_temp",
            related_id=cold_box.id,
            status="pending",
        )
        db.add(review_task)
        db.flush()

        alert = ColdBoxAlert(
            cold_box_id=cold_box.id,
            temperature=temperature,
            threshold=settings.COLD_BOX_TEMP_THRESHOLD,
            review_task_id=review_task.id,
            is_resolved=False,
        )
        db.add(alert)
    else:
        cold_box.is_abnormal = False

    db.commit()
    db.refresh(cold_box)
    return cold_box


def resolve_cold_box_alert(db: Session, alert_id: uuid.UUID) -> ColdBoxAlert:
    alert = db.query(ColdBoxAlert).filter(ColdBoxAlert.id == alert_id).first()
    if not alert:
        raise ValueError(f"Alert {alert_id} not found")

    alert.is_resolved = True
    if alert.review_task_id:
        review_task = (
            db.query(ReviewTask).filter(ReviewTask.id == alert.review_task_id).first()
        )
        if review_task:
            review_task.status = "completed"
            review_task.completed_at = datetime.now()

    db.commit()
    db.refresh(alert)
    return alert


def get_abnormal_cold_boxes(db: Session, route_id: uuid.UUID | None = None) -> list[ColdBox]:
    query = db.query(ColdBox).filter(ColdBox.is_abnormal == True)
    if route_id:
        query = query.filter(ColdBox.route_id == route_id)
    return query.all()


def complete_review_task(
    db: Session, task_id: uuid.UUID, result: str, assigned_to: str | None = None
) -> ReviewTask:
    task = db.query(ReviewTask).filter(ReviewTask.id == task_id).first()
    if not task:
        raise ValueError(f"ReviewTask {task_id} not found")

    task.status = "completed"
    task.result = result
    task.assigned_to = assigned_to
    task.completed_at = datetime.now()

    db.commit()
    db.refresh(task)
    return task
