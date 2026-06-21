from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Technician, WorkRecord, RepairOrder, Community, Review,
    OrderStatus, RefundReason, TechnicianStatus
)
from app.schemas import (
    TechnicianCreate, TechnicianOut, TechnicianLoadOut, TechnicianLoadDetail
)

router = APIRouter(prefix="/api/technicians", tags=["technicians"])


@router.get("", response_model=List[TechnicianOut])
def list_technicians(
    status: Optional[str] = None,
    community_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Technician)
    if status:
        q = q.filter(Technician.status == status)
    if community_id:
        q = q.filter(Technician.community_id == community_id)
    return q.order_by(Technician.id).all()


@router.get("/{tech_id}", response_model=TechnicianOut)
def get_technician(tech_id: int, db: Session = Depends(get_db)):
    t = db.query(Technician).filter(Technician.id == tech_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="师傅不存在")
    return t


@router.post("", response_model=TechnicianOut)
def create_technician(data: TechnicianCreate, db: Session = Depends(get_db)):
    t = Technician(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/load/list", response_model=List[dict])
def list_technician_load(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=14)
    if not end_date:
        end_date = date.today() + timedelta(days=3)

    techs = db.query(Technician).all()
    result = []
    for t in techs:
        recs = db.query(WorkRecord).filter(
            WorkRecord.technician_id == t.id,
            WorkRecord.work_date >= start_date,
            WorkRecord.work_date <= end_date
        ).all()
        assigned = db.query(RepairOrder).filter(
            RepairOrder.technician_id == t.id,
            RepairOrder.schedule_date >= start_date,
            RepairOrder.schedule_date <= end_date,
            RepairOrder.status.in_([OrderStatus.PENDING, OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS])
        ).count()
        total_hours = sum(r.hours_spent for r in recs)
        refunds = db.query(RepairOrder).filter(
            RepairOrder.technician_id == t.id,
            RepairOrder.status == OrderStatus.REFUNDED,
            RepairOrder.schedule_date >= start_date,
            RepairOrder.schedule_date <= end_date
        ).count()
        result.append({
            "technician_id": t.id,
            "technician_name": t.name,
            "phone": t.phone,
            "status": t.status.value if isinstance(t.status, TechnicianStatus) else t.status,
            "community_name": t.community.name if t.community else None,
            "rating_avg": t.rating_avg,
            "completed_count": len(recs),
            "assigned_count": assigned,
            "total_hours": round(total_hours, 1),
            "refund_count": refunds,
            "daily_max": t.daily_max_orders,
        })
    return result


@router.get("/{tech_id}/load", response_model=TechnicianLoadOut)
def get_technician_load_detail(
    tech_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    t = db.query(Technician).filter(Technician.id == tech_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="师傅不存在")

    recs = db.query(WorkRecord).filter(
        WorkRecord.technician_id == tech_id,
        WorkRecord.work_date >= start_date,
        WorkRecord.work_date <= end_date
    ).all()

    by_date_map = {}
    by_community_map = {}
    refund_map = {}
    total_hours = 0

    for r in recs:
        d = r.work_date
        if d not in by_date_map:
            by_date_map[d] = {"order_count": 0, "hours": 0.0, "refund_issues": 0, "refund_reasons": []}
        by_date_map[d]["order_count"] += 1
        by_date_map[d]["hours"] += r.hours_spent
        total_hours += r.hours_spent

        cid = r.community_id
        cname = r.order.community.name if (r.order and r.order.community) else "未分配"
        if cid not in by_community_map:
            by_community_map[cid] = {"community_id": cid, "community_name": cname, "order_count": 0, "hours": 0.0}
        by_community_map[cid]["order_count"] += 1
        by_community_map[cid]["hours"] += r.hours_spent

        if r.order and r.order.status == OrderStatus.REFUNDED and r.order.refund_reason:
            reason = r.order.refund_reason.value
            by_date_map[d]["refund_issues"] += 1
            if reason not in by_date_map[d]["refund_reasons"]:
                by_date_map[d]["refund_reasons"].append(reason)
            if reason not in refund_map:
                refund_map[reason] = 0
            refund_map[reason] += 1

    by_date = []
    for d, info in sorted(by_date_map.items()):
        by_date.append(TechnicianLoadDetail(
            date_key=d,
            community_id=None,
            community_name=None,
            order_count=info["order_count"],
            hours=round(info["hours"], 1),
            refund_issues=info["refund_issues"],
            refund_reasons=info["refund_reasons"]
        ))

    for cid, info in by_community_map.items():
        info["hours"] = round(info["hours"], 1)

    by_community = sorted(by_community_map.values(), key=lambda x: -x["order_count"])
    refund_breakdown = [{"reason": k, "count": v} for k, v in sorted(refund_map.items(), key=lambda x: -x[1])]

    reviews = db.query(Review).filter(Review.technician_id == tech_id).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 5.0

    return TechnicianLoadOut(
        technician_id=t.id,
        technician_name=t.name,
        total_orders=len(recs),
        total_hours=round(total_hours, 1),
        avg_rating=round(avg_rating, 2),
        by_date=by_date,
        by_community=by_community,
        refund_breakdown=refund_breakdown
    )
