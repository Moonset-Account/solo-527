from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta
from io import BytesIO
import json
from app.database import get_db
from app.models import (
    SafetyEvent, EventLevel, EventStatus, NotificationStatus,
    User, UserRole
)
from app.schemas import (
    NotificationRateStats, EventStatusStats,
    HandleDurationStats, PublicReportStats
)
from app.auth import require_authenticated, get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/notification-rate", response_model=NotificationRateStats)
def get_notification_rate(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    query = db.query(SafetyEvent)
    if start_date:
        query = query.filter(SafetyEvent.actual_occurred_at >= start_date)
    if end_date:
        query = query.filter(SafetyEvent.actual_occurred_at <= end_date)
    
    total = query.count()
    success = query.filter(SafetyEvent.notification_status == NotificationStatus.SUCCESS).count()
    failed = query.filter(SafetyEvent.notification_status == NotificationStatus.FAILED).count()
    
    rate = success / total if total > 0 else 0
    
    by_level = {}
    for level in EventLevel:
        level_query = query.filter(SafetyEvent.level == level)
        level_total = level_query.count()
        level_success = level_query.filter(SafetyEvent.notification_status == NotificationStatus.SUCCESS).count()
        level_rate = level_success / level_total if level_total > 0 else 0
        by_level[level.value] = {
            "total": level_total,
            "success": level_success,
            "rate": level_rate
        }
    
    return NotificationRateStats(
        total=total,
        success=success,
        failed=failed,
        rate=rate,
        by_level=by_level
    )


@router.get("/event-status", response_model=EventStatusStats)
def get_event_status_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    query = db.query(SafetyEvent)
    if start_date:
        query = query.filter(SafetyEvent.actual_occurred_at >= start_date)
    if end_date:
        query = query.filter(SafetyEvent.actual_occurred_at <= end_date)
    
    unconfirmed = query.filter(SafetyEvent.status == EventStatus.UNCONFIRMED).count()
    processing = query.filter(SafetyEvent.status == EventStatus.PROCESSING).count()
    closed = query.filter(SafetyEvent.status == EventStatus.CLOSED).count()
    
    by_level = {}
    for level in EventLevel:
        level_query = query.filter(SafetyEvent.level == level)
        by_level[level.value] = {
            "unconfirmed": level_query.filter(SafetyEvent.status == EventStatus.UNCONFIRMED).count(),
            "processing": level_query.filter(SafetyEvent.status == EventStatus.PROCESSING).count(),
            "closed": level_query.filter(SafetyEvent.status == EventStatus.CLOSED).count()
        }
    
    return EventStatusStats(
        unconfirmed=unconfirmed,
        processing=processing,
        closed=closed,
        by_level=by_level
    )


@router.get("/handle-duration", response_model=HandleDurationStats)
def get_handle_duration_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    query = db.query(SafetyEvent).filter(
        SafetyEvent.status == EventStatus.CLOSED,
        SafetyEvent.closed_at.isnot(None)
    )
    if start_date:
        query = query.filter(SafetyEvent.actual_occurred_at >= start_date)
    if end_date:
        query = query.filter(SafetyEvent.actual_occurred_at <= end_date)
    
    events = query.all()
    
    durations = []
    for event in events:
        if event.closed_at and event.actual_occurred_at:
            delta = event.closed_at - event.actual_occurred_at
            durations.append(delta.total_seconds() / 60)
    
    overall_avg = sum(durations) / len(durations) if durations else 0
    
    by_level = {}
    for level in EventLevel:
        level_events = [e for e in events if e.level == level]
        level_durations = []
        for e in level_events:
            if e.closed_at and e.actual_occurred_at:
                delta = e.closed_at - e.actual_occurred_at
                level_durations.append(delta.total_seconds() / 60)
        
        count = len(level_durations)
        avg = sum(level_durations) / count if count > 0 else 0
        median = 0
        if count > 0:
            sorted_dur = sorted(level_durations)
            median = sorted_dur[count // 2] if count % 2 == 1 else (sorted_dur[count//2-1] + sorted_dur[count//2]) / 2
        
        by_level[level.value] = {
            "count": count,
            "avg_minutes": avg,
            "median_minutes": median
        }
    
    by_date = []
    if events:
        date_groups = {}
        for event in events:
            date_key = event.actual_occurred_at.strftime("%Y-%m-%d")
            if date_key not in date_groups:
                date_groups[date_key] = []
            if event.closed_at and event.actual_occurred_at:
                delta = event.closed_at - event.actual_occurred_at
                date_groups[date_key].append(delta.total_seconds() / 60)
        
        for date_key in sorted(date_groups.keys()):
            dur_list = date_groups[date_key]
            by_date.append({
                "date": date_key,
                "avg_minutes": sum(dur_list) / len(dur_list) if dur_list else 0,
                "count": len(dur_list)
            })
    
    return HandleDurationStats(
        overall_avg_minutes=overall_avg,
        by_level=by_level,
        by_date=by_date
    )


@router.get("/public", response_model=PublicReportStats)
def get_public_report(
    db: Session = Depends(get_db)
):
    query = db.query(SafetyEvent).filter(SafetyEvent.status == EventStatus.CLOSED)
    
    total_events = db.query(SafetyEvent).count()
    
    level_distribution = {}
    for level in EventLevel:
        level_distribution[level.value] = db.query(SafetyEvent).filter(SafetyEvent.level == level).count()
    
    closed_events = query.all()
    durations = []
    for e in closed_events:
        if e.closed_at and e.actual_occurred_at:
            delta = e.closed_at - e.actual_occurred_at
            durations.append(delta.total_seconds() / 60)
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    total_notifications = db.query(SafetyEvent).count()
    success_notifications = db.query(SafetyEvent).filter(
        SafetyEvent.notification_status == NotificationStatus.SUCCESS
    ).count()
    notify_rate = success_notifications / total_notifications if total_notifications > 0 else 0
    
    events_by_month = []
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    month_events = db.query(
        extract('year', SafetyEvent.actual_occurred_at).label('year'),
        extract('month', SafetyEvent.actual_occurred_at).label('month'),
        func.count(SafetyEvent.id).label('count')
    ).filter(
        SafetyEvent.actual_occurred_at >= six_months_ago
    ).group_by(
        extract('year', SafetyEvent.actual_occurred_at),
        extract('month', SafetyEvent.actual_occurred_at)
    ).all()
    
    for y, m, cnt in month_events:
        events_by_month.append({
            "month": f"{int(y)}-{int(m):02d}",
            "count": cnt
        })
    
    return PublicReportStats(
        total_events=total_events,
        event_level_distribution=level_distribution,
        avg_handle_duration_minutes=avg_duration,
        notification_success_rate=notify_rate,
        events_by_month=events_by_month
    )


@router.get("/export")
def export_report(
    anonymous: bool = Query(False, description="Export anonymous report"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_anonymous = anonymous or (current_user is None) or (current_user.role != UserRole.PROJECT_MANAGER)
    
    events = db.query(SafetyEvent).order_by(SafetyEvent.actual_occurred_at.desc()).all()
    
    if is_anonymous:
        report_data = {
            "export_type": "anonymous",
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_events": len(events),
                "by_level": {},
                "by_status": {},
                "notification_rate": {}
            }
        }
        
        for level in EventLevel:
            report_data["summary"]["by_level"][level.value] = sum(1 for e in events if e.level == level)
        
        for status in EventStatus:
            report_data["summary"]["by_status"][status.value] = sum(1 for e in events if e.status == status)
        
        total = len(events)
        success = sum(1 for e in events if e.notification_status == NotificationStatus.SUCCESS)
        report_data["summary"]["notification_rate"] = {
            "total": total,
            "success": success,
            "rate": success / total if total > 0 else 0
        }
    else:
        events_data = []
        for event in events:
            handle_duration = None
            if event.closed_at and event.actual_occurred_at:
                delta = event.closed_at - event.actual_occurred_at
                handle_duration = int(delta.total_seconds() / 60)
            
            events_data.append({
                "id": str(event.id),
                "title": event.title,
                "description": event.description,
                "level": event.level.value,
                "status": event.status.value,
                "checkpoint": event.checkpoint.name if event.checkpoint else None,
                "teacher": event.teacher.name if event.teacher else None,
                "reviewer": event.reviewer.name if event.reviewer else None,
                "actual_occurred_at": event.actual_occurred_at.isoformat() if event.actual_occurred_at else None,
                "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
                "confirmed_at": event.confirmed_at.isoformat() if event.confirmed_at else None,
                "closed_at": event.closed_at.isoformat() if event.closed_at else None,
                "notification_status": event.notification_status.value,
                "notification_attempts": event.notification_attempts,
                "handle_duration_minutes": handle_duration,
                "original_record_url": event.original_record_url
            })
        
        report_data = {
            "export_type": "full",
            "generated_at": datetime.utcnow().isoformat(),
            "exported_by": current_user.name if current_user else None,
            "events": events_data
        }
    
    json_str = json.dumps(report_data, ensure_ascii=False, indent=2)
    buf = BytesIO(json_str.encode('utf-8'))
    buf.seek(0)
    
    filename = f"camp_safety_report_{'anonymous' if is_anonymous else 'full'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    
    return StreamingResponse(
        buf,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
