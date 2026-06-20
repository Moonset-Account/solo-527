from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
import time
from datetime import date, timedelta

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin, allow_manager
from app.models import User, ApiStatus, TreatmentCard, TreatmentCardStatus, Customer, Treatment
from app.redis_client import get_redis

router = APIRouter(prefix="/api", tags=["系统监控"])


@router.get("/api-status")
def list_api_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_manager)
):
    statuses = db.query(ApiStatus).order_by(ApiStatus.endpoint).all()
    items = []
    for s in statuses:
        items.append({
            "id": s.id,
            "endpoint": s.endpoint,
            "method": s.method,
            "last_called": s.last_called,
            "call_count": s.call_count,
            "error_count": s.error_count,
            "avg_response_time": s.avg_response_time,
            "status": s.status,
            "last_error": s.last_error
        })
    return {"items": items}


@router.get("/api-status/health")
def api_health_check(
    db: Session = Depends(get_db)
):
    db_healthy = False
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        db_healthy = False

    redis_healthy = False
    try:
        from app.redis_client import redis_client
        redis_client.ping()
        redis_healthy = True
    except Exception:
        redis_healthy = False

    total_apis = 0
    error_apis = 0
    if db_healthy:
        try:
            total_apis = db.query(ApiStatus).count()
            error_apis = db.query(ApiStatus).filter(ApiStatus.status == "error").count()
        except Exception:
            pass

    return {
        "database": "healthy" if db_healthy else "unhealthy",
        "redis": "healthy" if redis_healthy else "unhealthy",
        "total_apis": total_apis,
        "error_apis": error_apis,
        "overall": "healthy" if (db_healthy and redis_healthy and error_apis == 0) else "degraded"
    }


@router.get("/renewal-board")
def renewal_board(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_manager)
):
    from sqlalchemy import func, or_

    today = date.today()
    target_date = today + timedelta(days=days)

    expiring_soon = db.query(TreatmentCard).filter(
        TreatmentCard.status == TreatmentCardStatus.ACTIVE,
        TreatmentCard.expiry_date.isnot(None),
        TreatmentCard.expiry_date <= target_date,
        TreatmentCard.expiry_date >= today
    ).order_by(TreatmentCard.expiry_date.asc()).all()

    low_sessions = db.query(TreatmentCard).filter(
        TreatmentCard.status == TreatmentCardStatus.ACTIVE,
        TreatmentCard.remaining_sessions <= 3,
        TreatmentCard.remaining_sessions > 0
    ).order_by(TreatmentCard.remaining_sessions.asc()).all()

    used_up = db.query(TreatmentCard).filter(
        TreatmentCard.status == TreatmentCardStatus.USED_UP
    ).order_by(desc(TreatmentCard.updated_at)).limit(20).all()

    expiring_items = []
    for card in expiring_soon:
        expiring_items.append({
            "id": card.id,
            "card_no": card.card_no,
            "customer_name": card.customer.name,
            "customer_phone": card.customer.phone,
            "treatment_name": card.treatment.name,
            "remaining_sessions": card.remaining_sessions,
            "expiry_date": card.expiry_date,
            "days_left": (card.expiry_date - today).days
        })

    low_sessions_items = []
    for card in low_sessions:
        low_sessions_items.append({
            "id": card.id,
            "card_no": card.card_no,
            "customer_name": card.customer.name,
            "customer_phone": card.customer.phone,
            "treatment_name": card.treatment.name,
            "remaining_sessions": card.remaining_sessions,
            "total_sessions": card.total_sessions,
            "expiry_date": card.expiry_date
        })

    used_up_items = []
    for card in used_up:
        used_up_items.append({
            "id": card.id,
            "card_no": card.card_no,
            "customer_name": card.customer.name,
            "customer_phone": card.customer.phone,
            "treatment_name": card.treatment.name,
            "total_sessions": card.total_sessions,
            "updated_at": card.updated_at
        })

    stats = {
        "expiring_soon_count": len(expiring_soon),
        "low_sessions_count": len(low_sessions),
        "used_up_count": db.query(TreatmentCard).filter(TreatmentCard.status == TreatmentCardStatus.USED_UP).count(),
        "active_count": db.query(TreatmentCard).filter(TreatmentCard.status == TreatmentCardStatus.ACTIVE).count()
    }

    return {
        "stats": stats,
        "expiring_soon": expiring_items,
        "low_sessions": low_sessions_items,
        "used_up_recent": used_up_items
    }


@router.get("/reminder-rules")
def list_reminder_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_manager)
):
    from app.models import ReminderRule
    rules = db.query(ReminderRule).all()
    return {"items": rules}
