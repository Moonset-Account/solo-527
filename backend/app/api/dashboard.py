from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/dashboard", tags=["仪表板"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    pending_todos = (
        db.query(models.TodoItem)
        .filter(models.TodoItem.is_completed == False)
        .count()
    )
    overdue_alerts = (
        db.query(models.EnvironmentAlert)
        .filter(
            models.EnvironmentAlert.is_handled == False,
        )
        .count()
    )
    recent_records = (
        db.query(models.FarmRecord)
        .filter(models.FarmRecord.created_at >= datetime.now() - timedelta(days=7))
        .count()
    )
    active_plots = (
        db.query(models.Plot).filter(models.Plot.status == "active").count()
    )
    growing_batches = (
        db.query(models.Batch).filter(models.Batch.status == "growing").count()
    )
    pending_orders = (
        db.query(models.SortingOrder).filter(models.SortingOrder.status == "pending").count()
    )
    return {
        "pending_todos_count": pending_todos,
        "overdue_alerts_count": overdue_alerts,
        "recent_records_count": recent_records,
        "active_plots_count": active_plots,
        "growing_batches_count": growing_batches,
        "pending_orders_count": pending_orders,
    }


@router.get("/recent-records")
def get_recent_records(limit: int = 10, db: Session = Depends(get_db)):
    records = (
        db.query(
            models.FarmRecord,
            models.Batch.batch_no.label("batch_no"),
            models.Variety.name.label("variety_name"),
            models.User.full_name.label("operator_name"),
        )
        .join(models.Batch, models.FarmRecord.batch_id == models.Batch.id)
        .join(models.Variety, models.Batch.variety_id == models.Variety.id)
        .outerjoin(models.User, models.FarmRecord.operator_id == models.User.id)
        .order_by(desc(models.FarmRecord.created_at))
        .limit(limit)
        .all()
    )
    result = []
    for record, batch_no, variety_name, operator_name in records:
        result.append(
            {
                "id": record.id,
                "record_no": record.record_no,
                "title": record.title,
                "record_type": record.record_type,
                "batch_no": batch_no,
                "variety_name": variety_name,
                "operator_name": operator_name,
                "record_time": record.record_time,
                "created_at": record.created_at,
            }
        )
    return result


@router.get("/overdue-alerts")
def get_overdue_alerts(limit: int = 10, db: Session = Depends(get_db)):
    alerts = (
        db.query(
            models.EnvironmentAlert,
            models.Plot.name.label("plot_name"),
            models.Plot.code.label("plot_code"),
        )
        .join(models.Plot, models.EnvironmentAlert.plot_id == models.Plot.id)
        .filter(models.EnvironmentAlert.is_handled == False)
        .order_by(desc(models.EnvironmentAlert.created_at))
        .limit(limit)
        .all()
    )
    result = []
    for alert, plot_name, plot_code in alerts:
        result.append(
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "alert_level": alert.alert_level,
                "metric": alert.metric,
                "current_value": alert.current_value,
                "message": alert.message,
                "plot_name": plot_name,
                "plot_code": plot_code,
                "created_at": alert.created_at,
            }
        )
    return result


@router.get("/expiring-items")
def get_expiring_items(db: Session = Depends(get_db)):
    now = datetime.now()
    soon = now + timedelta(days=3)

    expiring_reservations = (
        db.query(models.MachineReservation)
        .filter(
            models.MachineReservation.status == "pending",
            models.MachineReservation.start_time >= now,
            models.MachineReservation.start_time <= soon,
        )
        .order_by(models.MachineReservation.start_time)
        .limit(5)
        .all()
    )

    expiring_orders = (
        db.query(
            models.SortingOrder,
            models.Batch.batch_no.label("batch_no"),
        )
        .join(models.Batch, models.SortingOrder.batch_id == models.Batch.id)
        .filter(
            models.SortingOrder.status == "pending",
            models.SortingOrder.scheduled_time >= now,
            models.SortingOrder.scheduled_time <= soon,
        )
        .order_by(models.SortingOrder.scheduled_time)
        .limit(5)
        .all()
    )

    return {
        "expiring_reservations": expiring_reservations,
        "expiring_orders": [
            {"order": o, "batch_no": b} for o, b in expiring_orders
        ],
    }
