from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.models import (
    RepairOrder, Region, Community, Technician, Review,
    OrderStatus, TechnicianStatus, ActionLog, RefundReason
)
from app.schemas import RegionOut, CommunityOut, ActionLogOut

router = APIRouter(prefix="/api/dispatch", tags=["dispatch"])


@router.get("/regions", response_model=List[RegionOut])
def list_regions(db: Session = Depends(get_db)):
    return db.query(Region).order_by(Region.id).all()


@router.get("/communities", response_model=List[CommunityOut])
def list_communities(region_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Community)
    if region_id:
        q = q.filter(Community.region_id == region_id)
    return q.order_by(Community.id).all()


@router.get("/dashboard")
def dispatch_dashboard(db: Session = Depends(get_db)):
    today = date.today()

    region_stats = []
    regions = db.query(Region).all()
    for r in regions:
        total = db.query(RepairOrder).filter(RepairOrder.region_id == r.id, RepairOrder.schedule_date == today).count()
        pending = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == OrderStatus.PENDING
        ).count()
        in_progress = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == OrderStatus.IN_PROGRESS
        ).count()
        completed = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == OrderStatus.COMPLETED
        ).count()
        region_stats.append({
            "region_id": r.id,
            "region_name": r.name,
            "demand_level": r.demand_level,
            "total_today": total,
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed
        })

    idle_techs = db.query(Technician).filter(Technician.status == TechnicianStatus.IDLE).all()
    busy_techs = db.query(Technician).filter(Technician.status == TechnicianStatus.BUSY).all()

    pending_orders = db.query(RepairOrder).filter(
        RepairOrder.status.in_([OrderStatus.PENDING, OrderStatus.ASSIGNED])
    ).order_by(RepairOrder.priority.desc(), RepairOrder.created_at).limit(20).all()

    abnormal_orders = db.query(RepairOrder).filter(
        RepairOrder.status.in_([OrderStatus.REFUND_REQUESTED, OrderStatus.REFUNDED])
    ).order_by(RepairOrder.updated_at.desc()).limit(15).all()

    return {
        "today": today.isoformat(),
        "region_stats": region_stats,
        "idle_technicians": [
            {"id": t.id, "name": t.name, "community": t.community.name if t.community else None, "rating": t.rating_avg}
            for t in idle_techs
        ],
        "busy_technicians": [
            {"id": t.id, "name": t.name, "community": t.community.name if t.community else None, "today_orders": t.today_orders}
            for t in busy_techs
        ],
        "pending_orders": [
            {
                "id": o.id, "order_no": o.order_no, "customer": o.customer_name,
                "appliance": o.appliance_type, "status": o.status.value if isinstance(o.status, OrderStatus) else o.status,
                "address": o.full_address, "priority": o.priority,
                "schedule_date": o.schedule_date.isoformat() if o.schedule_date else None,
                "time_slot": o.schedule_time_slot
            }
            for o in pending_orders
        ],
        "abnormal_orders": [
            {
                "id": o.id, "order_no": o.order_no, "customer": o.customer_name,
                "status": o.status.value if isinstance(o.status, OrderStatus) else o.status,
                "refund_reason": o.refund_reason.value if isinstance(o.refund_reason, RefundReason) and o.refund_reason else o.refund_reason,
                "refund_amount": o.refund_amount
            }
            for o in abnormal_orders
        ]
    }


@router.get("/todos")
def get_todos(db: Session = Depends(get_db)):
    today = date.today()
    unassigned = db.query(RepairOrder).filter(
        RepairOrder.technician_id.is_(None),
        RepairOrder.status == OrderStatus.PENDING
    ).count()
    today_scheduled = db.query(RepairOrder).filter(
        RepairOrder.schedule_date == today,
        RepairOrder.status.in_([OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
    ).count()
    from sqlalchemy import not_
    pending_review = db.query(RepairOrder).outerjoin(Review).filter(
        RepairOrder.status == OrderStatus.COMPLETED,
        Review.id.is_(None)
    ).count()
    refund_requests = db.query(RepairOrder).filter(
        RepairOrder.status == OrderStatus.REFUND_REQUESTED
    ).count()
    return {
        "unassigned": unassigned,
        "today_scheduled": today_scheduled,
        "pending_review": pending_review,
        "refund_requests": refund_requests
    }


@router.get("/logs", response_model=List[ActionLogOut])
def get_action_logs(
    limit: int = 50,
    operator: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ActionLog)
    if operator:
        q = q.filter(ActionLog.operator.ilike(f"%{operator}%"))
    return q.order_by(ActionLog.created_at.desc()).limit(limit).all()
