from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models import Review, RepairOrder, ActionType, RefundReason, OrderStatus, Community
from app.schemas import ReviewCreate, ReviewOut
from app.utils import log_action

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewOut])
def list_reviews(
    revisited: Optional[bool] = None,
    min_rating: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Review)
    if revisited is not None:
        q = q.filter(Review.revisited == revisited)
    if min_rating is not None:
        q = q.filter(Review.rating >= min_rating)
    return q.order_by(Review.created_at.desc()).limit(200).all()


@router.post("", response_model=ReviewOut)
def create_review(data: ReviewCreate, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    existing = db.query(Review).filter(Review.order_id == data.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="该订单已有评价")
    rev = Review(**data.model_dump())
    db.add(rev)
    db.commit()
    db.refresh(rev)
    log_action(db, ActionType.REVIEW, "客服回访", data.order_id, {"rating": rev.rating})
    return rev


@router.post("/{review_id}/revisit", response_model=ReviewOut)
def mark_revisited(review_id: int, revisit_note: str, db: Session = Depends(get_db)):
    rev = db.query(Review).filter(Review.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="评价不存在")
    rev.revisited = True
    rev.revisit_note = revisit_note
    rev.revisited_by = "维修站长"
    rev.revisited_at = func.now()
    db.commit()
    db.refresh(rev)
    log_action(db, ActionType.REVIEW, "维修站长", rev.order_id, {"revisited": True})
    return rev


@router.get("/report/summary")
def review_summary(db: Session = Depends(get_db)):
    total = db.query(Review).count()
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 0
    by_rating = db.query(Review.rating, func.count(Review.id)).group_by(Review.rating).all()
    not_revisited = db.query(Review).filter(Review.revisited == False).count()
    low_rating = db.query(Review).filter(Review.rating <= 3).count()
    return {
        "total": total,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else 0,
        "by_rating": [{"rating": r, "count": c} for r, c in by_rating],
        "not_revisited": not_revisited,
        "low_rating_count": low_rating
    }


@router.get("/report/demand")
def demand_report(start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    q = db.query(
        Community.name.label("community"),
        func.count(RepairOrder.id).label("count")
    ).outerjoin(RepairOrder, RepairOrder.community_id == Community.id).filter(
        RepairOrder.created_at >= start_date,
        RepairOrder.created_at <= end_date
    ).group_by(Community.id, Community.name).order_by(func.count(RepairOrder.id).desc())

    return [
        {"community": r.community, "order_count": r.count} for r in q.all()
    ]


@router.get("/report/refunds")
def refund_report(start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = Depends(get_db)):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    by_reason = db.query(
        RepairOrder.refund_reason,
        func.count(RepairOrder.id),
        func.sum(RepairOrder.refund_amount)
    ).filter(
        RepairOrder.status == OrderStatus.REFUNDED,
        RepairOrder.refunded_at >= start_date,
        RepairOrder.refunded_at <= end_date
    ).group_by(RepairOrder.refund_reason).all()

    total_refunds = sum(c for _, c, _ in by_reason)
    total_amount = sum(float(a or 0) for _, _, a in by_reason)

    return {
        "total_refunds": total_refunds,
        "total_amount": round(total_amount, 2),
        "by_reason": [
            {
                "reason": r.value if isinstance(r, RefundReason) and r else r,
                "count": c,
                "amount": round(float(a or 0), 2),
                "percent": round(c / total_refunds * 100, 1) if total_refunds else 0
            }
            for r, c, a in by_reason
        ]
    }
