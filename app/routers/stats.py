from datetime import date, datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models import Appointment, CheckIn, Schedule, Doctor

router = APIRouter()


@router.get("/conversion")
def get_conversion_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    total_appointments = db.query(Appointment).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date
    ).count()

    checked_in = db.query(Appointment).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date,
        Appointment.status == "checked_in"
    ).count()

    no_show = db.query(Appointment).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date,
        Appointment.status == "no_show"
    ).count()

    cancelled = db.query(Appointment).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date,
        Appointment.status == "cancelled"
    ).count()

    conversion_rate = (checked_in / total_appointments * 100) if total_appointments > 0 else 0
    no_show_rate = (no_show / total_appointments * 100) if total_appointments > 0 else 0

    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "total_appointments": total_appointments,
        "checked_in": checked_in,
        "no_show": no_show,
        "cancelled": cancelled,
        "conversion_rate": round(conversion_rate, 2),
        "no_show_rate": round(no_show_rate, 2)
    }


@router.get("/by-source")
def get_stats_by_source(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    results = db.query(
        Appointment.source,
        func.count(Appointment.id).label("total"),
        func.sum(func.case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
        func.sum(func.case((Appointment.status == "no_show", 1), else_=0)).label("no_show"),
        func.sum(func.case((Appointment.status == "cancelled", 1), else_=0)).label("cancelled")
    ).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date
    ).group_by(Appointment.source).all()

    source_stats = []
    for row in results:
        total = row.total or 0
        checked_in = row.checked_in or 0
        conversion_rate = (checked_in / total * 100) if total > 0 else 0
        source_stats.append({
            "source": row.source or "unknown",
            "total": total,
            "checked_in": checked_in,
            "no_show": row.no_show or 0,
            "cancelled": row.cancelled or 0,
            "conversion_rate": round(conversion_rate, 2)
        })

    return source_stats


@router.get("/by-doctor")
def get_stats_by_doctor(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    results = db.query(
        Doctor.name.label("doctor_name"),
        Doctor.id.label("doctor_id"),
        func.count(Appointment.id).label("total"),
        func.sum(func.case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
        func.sum(func.case((Appointment.status == "no_show", 1), else_=0)).label("no_show")
    ).join(Appointment, Appointment.doctor_id == Doctor.id).join(Schedule).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date
    ).group_by(Doctor.id, Doctor.name).all()

    doctor_stats = []
    for row in results:
        total = row.total or 0
        checked_in = row.checked_in or 0
        conversion_rate = (checked_in / total * 100) if total > 0 else 0
        doctor_stats.append({
            "doctor_id": row.doctor_id,
            "doctor_name": row.doctor_name,
            "total": total,
            "checked_in": checked_in,
            "no_show": row.no_show or 0,
            "conversion_rate": round(conversion_rate, 2)
        })

    return doctor_stats


@router.get("/daily")
def get_daily_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=7)
    if not end_date:
        end_date = date.today()

    results = db.query(
        Schedule.schedule_date,
        func.count(Appointment.id).label("total"),
        func.sum(func.case((Appointment.status == "checked_in", 1), else_=0)).label("checked_in"),
        func.sum(func.case((Appointment.status == "no_show", 1), else_=0)).label("no_show")
    ).outerjoin(Appointment, Appointment.schedule_id == Schedule.id).filter(
        Schedule.schedule_date >= start_date,
        Schedule.schedule_date <= end_date
    ).group_by(Schedule.schedule_date).order_by(Schedule.schedule_date).all()

    daily_stats = []
    for row in results:
        total = row.total or 0
        checked_in = row.checked_in or 0
        conversion_rate = (checked_in / total * 100) if total > 0 else 0
        daily_stats.append({
            "date": row.schedule_date.isoformat(),
            "total": total,
            "checked_in": checked_in,
            "no_show": row.no_show or 0,
            "conversion_rate": round(conversion_rate, 2)
        })

    return daily_stats
