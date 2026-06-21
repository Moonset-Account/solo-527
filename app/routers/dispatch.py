from typing import List, Optional
from datetime import date, datetime
import json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.redis_client import get_redis
from app.models import (
    RepairOrder, Region, Community, Technician, Review,
    OrderStatus, TechnicianStatus, ActionLog, RefundReason, ActionType
)
from app.schemas import RegionOut, CommunityOut, ActionLogOut

router = APIRouter(prefix="/api/dispatch", tags=["dispatch"])


def _ev(e):
    return e.value if hasattr(e, "value") else e


def _cache_get(key: str):
    try:
        r = get_redis()
        data = r.get(key)
        if data:
            return json.loads(data)
    except Exception:
        return None
    return None


def _cache_set(key: str, value, ttl: int = 30):
    try:
        r = get_redis()
        r.setex(key, ttl, json.dumps(value, ensure_ascii=False, default=str))
    except Exception:
        pass


def _cache_invalidate(*keys):
    try:
        r = get_redis()
        for k in keys:
            r.delete(k)
    except Exception:
        pass


@router.get("/regions", response_model=List[RegionOut])
def list_regions(db: Session = Depends(get_db)):
    key = "dispatch:regions"
    cached = _cache_get(key)
    if cached:
        return cached
    data = db.query(Region).order_by(Region.id).all()
    _cache_set(key, [RegionOut.model_validate(x).model_dump() for x in data], 300)
    return data


@router.get("/communities", response_model=List[CommunityOut])
def list_communities(region_id: Optional[int] = None, db: Session = Depends(get_db)):
    key = f"dispatch:communities:{region_id or 'all'}"
    cached = _cache_get(key)
    if cached:
        return cached
    q = db.query(Community)
    if region_id:
        q = q.filter(Community.region_id == region_id)
    data = q.order_by(Community.id).all()
    _cache_set(key, [CommunityOut.model_validate(x).model_dump() for x in data], 300)
    return data


@router.get("/dashboard")
def dispatch_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    cache_key = f"dispatch:dashboard:{today.isoformat()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    region_stats = []
    regions = db.query(Region).all()
    _s = lambda e: _ev(e)
    for r in regions:
        total = db.query(RepairOrder).filter(RepairOrder.region_id == r.id, RepairOrder.schedule_date == today).count()
        pending = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == _s(OrderStatus.PENDING)
        ).count()
        in_progress = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == _s(OrderStatus.IN_PROGRESS)
        ).count()
        completed = db.query(RepairOrder).filter(
            RepairOrder.region_id == r.id,
            RepairOrder.schedule_date == today,
            RepairOrder.status == _s(OrderStatus.COMPLETED)
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

    idle_techs = db.query(Technician).filter(Technician.status == _s(TechnicianStatus.IDLE)).all()
    busy_techs = db.query(Technician).filter(Technician.status == _s(TechnicianStatus.BUSY)).all()

    pending_orders = db.query(RepairOrder).filter(
        RepairOrder.status.in_([_s(OrderStatus.PENDING), _s(OrderStatus.ASSIGNED)])
    ).order_by(RepairOrder.priority.desc(), RepairOrder.created_at).limit(20).all()

    abnormal_orders = db.query(RepairOrder).filter(
        RepairOrder.status.in_([_s(OrderStatus.REFUND_REQUESTED), _s(OrderStatus.REFUNDED)])
    ).order_by(RepairOrder.updated_at.desc()).limit(15).all()

    result = {
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
                "appliance": o.appliance_type, "status": _s(o.status),
                "address": o.full_address, "priority": o.priority,
                "schedule_date": o.schedule_date.isoformat() if o.schedule_date else None,
                "time_slot": o.schedule_time_slot
            }
            for o in pending_orders
        ],
        "abnormal_orders": [
            {
                "id": o.id, "order_no": o.order_no, "customer": o.customer_name,
                "status": _s(o.status),
                "refund_reason": _s(o.refund_reason) if o.refund_reason else None,
                "refund_amount": o.refund_amount
            }
            for o in abnormal_orders
        ]
    }
    _cache_set(cache_key, result, ttl=15)
    return result


@router.get("/todos")
def get_todos(db: Session = Depends(get_db)):
    today = date.today()
    cache_key = f"dispatch:todos:{today.isoformat()}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    _s = lambda e: _ev(e)
    unassigned = db.query(RepairOrder).filter(
        RepairOrder.technician_id.is_(None),
        RepairOrder.status == _s(OrderStatus.PENDING)
    ).count()
    today_scheduled = db.query(RepairOrder).filter(
        RepairOrder.schedule_date == today,
        RepairOrder.status.in_([_s(OrderStatus.ASSIGNED), _s(OrderStatus.IN_PROGRESS)])
    ).count()
    from sqlalchemy import not_
    pending_review = db.query(RepairOrder).outerjoin(Review).filter(
        RepairOrder.status == _s(OrderStatus.COMPLETED),
        Review.id.is_(None)
    ).count()
    refund_requests = db.query(RepairOrder).filter(
        RepairOrder.status == _s(OrderStatus.REFUND_REQUESTED)
    ).count()
    result = {
        "unassigned": unassigned,
        "today_scheduled": today_scheduled,
        "pending_review": pending_review,
        "refund_requests": refund_requests
    }
    _cache_set(cache_key, result, ttl=20)
    return result


@router.get("/logs", response_model=List[ActionLogOut])
def get_action_logs(
    limit: int = 50,
    operator: Optional[str] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ActionLog)
    if operator:
        q = q.filter(ActionLog.operator.ilike(f"%{operator}%"))
    if order_id:
        q = q.filter(ActionLog.order_id == order_id)
    return q.order_by(ActionLog.created_at.desc()).limit(limit).all()


_action_labels = {
    "create_order": "创建工单",
    "assign_technician": "派单",
    "update_status": "更新状态",
    "schedule": "预约安排",
    "refund": "退款处理",
    "review": "评价回访",
    "update_technician": "更新师傅",
}


@router.get("/logs/rows", response_class=HTMLResponse)
def get_action_log_rows(
    limit: int = 50,
    operator: Optional[str] = None,
    order_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ActionLog)
    if operator:
        q = q.filter(ActionLog.operator.ilike(f"%{operator}%"))
    if order_id:
        q = q.filter(ActionLog.order_id == order_id)
    logs = q.order_by(ActionLog.created_at.desc()).limit(limit).all()
    if not logs:
        return '<tr><td colspan="5" class="empty">暂无操作记录</td></tr>'

    rows = []
    for l in logs:
        label = _action_labels.get(l.action_type, l.action_type)
        detail_json = json.dumps(l.detail or {}, ensure_ascii=False) if l.detail else "{}"
        order_link = f'<a href="/orders/{l.order_id}" class="link-btn">#{l.order_id}</a>' if l.order_id else "-"
        rows.append(f"""
<tr>
    <td class="mono">{l.created_at}</td>
    <td><strong>{l.operator}</strong></td>
    <td><span class="badge badge-info">{label}</span></td>
    <td>{order_link}</td>
    <td class="detail-cell"><code>{detail_json}</code></td>
</tr>""".strip())
    return "\n".join(rows)


@router.get("/communities/options", response_class=HTMLResponse)
def get_community_options(
    region_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Community)
    if region_id:
        q = q.filter(Community.region_id == region_id)
    items = q.order_by(Community.name).all()
    if not items:
        return '<option value="">暂无社区</option>'
    options = ['<option value="">请选择社区</option>']
    for c in items:
        options.append(f'<option value="{c.id}">{c.name}</option>')
    return "\n".join(options)
