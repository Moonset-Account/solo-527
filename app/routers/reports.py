from datetime import date, datetime
from typing import Optional, Dict, List
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.services import ReportExportService, NotificationService, DataScopeService

router = APIRouter()


def _paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pagination = schemas.Pagination(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
    return items, pagination


def _parse_date_param(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式应为 YYYY-MM-DD")


def _excel_streaming_response(excel_bytes: bytes, filename: str) -> StreamingResponse:
    buf = BytesIO(excel_bytes)
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
    }
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/downloads", response_model=schemas.PaginatedResponse[schemas.DownloadRecordOut])
def list_downloads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.DownloadRecord)
        .filter(models.DownloadRecord.user_id == current_user.id)
        .order_by(models.DownloadRecord.downloaded_at.desc())
    )
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.get("/export/harvests")
def export_harvests(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    include_demo: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    start = _parse_date_param(start_date)
    end = _parse_date_param(end_date)
    excel_bytes = ReportExportService.export_harvests_excel(
        db=db,
        start_date=start,
        end_date=end,
        include_demo=include_demo,
        user_id=current_user.id,
    )
    db.commit()
    filename = f"harvests_{start_date or 'all'}_{end_date or 'all'}.xlsx"
    return _excel_streaming_response(excel_bytes, filename)


@router.get("/export/batches")
def export_batches(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    include_demo: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    start = _parse_date_param(start_date)
    end = _parse_date_param(end_date)
    excel_bytes = ReportExportService.export_batches_excel(
        db=db,
        start_date=start,
        end_date=end,
        include_demo=include_demo,
        user_id=current_user.id,
    )
    db.commit()
    filename = f"batches_{start_date or 'all'}_{end_date or 'all'}.xlsx"
    return _excel_streaming_response(excel_bytes, filename)


@router.get("/export/sorting")
def export_sorting(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    include_demo: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    start = _parse_date_param(start_date)
    end = _parse_date_param(end_date)
    excel_bytes = ReportExportService.export_sorting_excel(
        db=db,
        start_date=start,
        end_date=end,
        include_demo=include_demo,
        user_id=current_user.id,
    )
    db.commit()
    filename = f"sorting_{start_date or 'all'}_{end_date or 'all'}.xlsx"
    return _excel_streaming_response(excel_bytes, filename)


@router.get("/notifications", response_model=schemas.PaginatedResponse[schemas.NotificationOut])
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
    )
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/notifications/{notif_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = NotificationService.mark_read(db, notif_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="通知不存在")
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/notifications/read-all", response_model=Dict)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    count = NotificationService.mark_all_read(db, current_user.id)
    db.commit()
    return {"mark_read_count": count}


@router.get("/notifications/unread", response_model=List[schemas.NotificationOut])
def list_unread_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return NotificationService.list_unread(db, current_user.id)


@router.get("/summary", response_model=Dict)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    harvest_count = DataScopeService.filter_real_reports(db.query(models.HarvestRecord)).count()
    batch_count = DataScopeService.filter_real_reports(db.query(models.HarvestBatch)).count()
    unresolved_alert_count = DataScopeService.filter_real_reports(
        db.query(models.Alert).filter(models.Alert.status != models.AlertStatus.RESOLVED)
    ).count()
    sorting_diff_count = DataScopeService.filter_real_reports(db.query(models.SortingDifference)).count()

    today = date.today()
    month_start = date(today.year, today.month, 1)

    monthly_yield = DataScopeService.filter_real_reports(
        db.query(func.coalesce(func.sum(models.HarvestRecord.actual_yield_kg), 0.0))
    ).filter(models.HarvestRecord.harvest_date >= month_start).scalar() or 0.0

    monthly_subsidy = DataScopeService.filter_real_reports(
        db.query(func.coalesce(func.sum(models.SubsidyVoucher.amount), 0.0))
    ).filter(models.SubsidyVoucher.applied_at >= datetime.combine(month_start, datetime.min.time())).scalar() or 0.0

    predicted_yield_sum = DataScopeService.filter_real_reports(
        db.query(func.coalesce(func.sum(models.HarvestRecord.predicted_yield_kg), 0.0))
    ).scalar() or 0.0

    open_alerts = DataScopeService.filter_real_reports(
        db.query(models.Alert).filter(models.Alert.status == models.AlertStatus.OPEN)
    ).count()

    return {
        "harvest_total": harvest_count,
        "batch_total": batch_count,
        "unresolved_alert_total": unresolved_alert_count,
        "sorting_diff_total": sorting_diff_count,
        "monthly_yield_kg": float(monthly_yield),
        "monthly_subsidy_amount": float(monthly_subsidy),
        "harvests": harvest_count,
        "batches": batch_count,
        "open_alerts": open_alerts,
        "predicted_yield": float(predicted_yield_sum),
        "subsidy_amount": float(monthly_subsidy),
        "sorting_diffs": sorting_diff_count,
    }
