from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import dashboard_service
from app.schemas.dashboard import (
    DashboardStats, TodoItem, OverdueItem, RecentSubmission, MonthlyFillRateReport,
)

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    campus_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_stats(db, campus_id, user_id)


@router.get("/todos", response_model=List[TodoItem])
def get_todos(
    campus_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_todo_items(db, campus_id, user_id, limit)


@router.get("/overdue", response_model=List[OverdueItem])
def get_overdue(
    campus_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_overdue_items(db, campus_id, user_id, limit)


@router.get("/recent-submissions", response_model=List[RecentSubmission])
def get_recent_submissions(
    campus_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_recent_submissions(db, campus_id, days, limit)


@router.get("/fill-rate/monthly", response_model=MonthlyFillRateReport)
def get_monthly_fill_rate(
    campus_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    if year and month:
        from datetime import date as _date
        m = _date(year, month, 1)
    else:
        m = None
    return dashboard_service.get_monthly_fill_rate(db, campus_id, m)


@router.post("/reminders/scan-homework")
def scan_homework_unsubmitted(db: Session = Depends(get_db)):
    count = dashboard_service.create_homework_reminders_for_unsubmitted(db)
    return {"created": count, "message": f"扫描完成，新增/更新 {count} 条作业提醒"}
