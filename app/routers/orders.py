import os
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.config import get_settings
from app.models import RepairOrder, Region, Community, Technician, OrderStatus, ActionType
from app.schemas import RepairOrderCreate, RepairOrderUpdate, RepairOrderOut
from app.utils import generate_order_no, log_action, build_full_address

router = APIRouter(prefix="/api/orders", tags=["orders"])
settings = get_settings()
os.makedirs(settings.upload_dir, exist_ok=True)


@router.get("", response_model=List[RepairOrderOut])
def list_orders(
    status: Optional[str] = None,
    region_id: Optional[int] = None,
    technician_id: Optional[int] = None,
    schedule_date: Optional[date] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(RepairOrder)
    if status:
        q = q.filter(RepairOrder.status == status)
    if region_id:
        q = q.filter(RepairOrder.region_id == region_id)
    if technician_id:
        q = q.filter(RepairOrder.technician_id == technician_id)
    if schedule_date:
        q = q.filter(RepairOrder.schedule_date == schedule_date)
    if keyword:
        kw = f"%{keyword}%"
        q = q.filter(or_(
            RepairOrder.order_no.ilike(kw),
            RepairOrder.customer_name.ilike(kw),
            RepairOrder.customer_phone.ilike(kw),
            RepairOrder.address_detail.ilike(kw),
        ))
    return q.order_by(RepairOrder.created_at.desc()).limit(200).all()


@router.get("/{order_id}", response_model=RepairOrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("", response_model=RepairOrderOut)
def create_order(data: RepairOrderCreate, db: Session = Depends(get_db)):
    order = RepairOrder(**data.model_dump())
    order.order_no = generate_order_no()
    region = db.query(Region).filter(Region.id == data.region_id).first() if data.region_id else None
    community = db.query(Community).filter(Community.id == data.community_id).first() if data.community_id else None
    order.full_address = build_full_address(
        region.name if region else None,
        community.name if community else None,
        data.address_detail
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    log_action(db, ActionType.CREATE_ORDER, "维修站长", order.id, {
        "order_no": order.order_no, "customer": order.customer_name
    })
    return order


@router.post("/submit-with-photos", response_model=RepairOrderOut)
async def submit_order_with_photos(
    customer_name: str = Form(...),
    customer_phone: str = Form(...),
    appliance_type: Optional[str] = Form(None),
    fault_description: Optional[str] = Form(None),
    address_detail: str = Form(...),
    region_id: Optional[int] = Form(None),
    community_id: Optional[int] = Form(None),
    schedule_date: Optional[date] = Form(None),
    schedule_time_slot: Optional[str] = Form(None),
    priority: int = Form(1),
    photos: List[UploadFile] = File(default_factory=list),
    db: Session = Depends(get_db)
):
    order = RepairOrder(
        order_no=generate_order_no(),
        customer_name=customer_name,
        customer_phone=customer_phone,
        appliance_type=appliance_type,
        fault_description=fault_description,
        address_detail=address_detail,
        region_id=region_id,
        community_id=community_id,
        schedule_date=schedule_date,
        schedule_time_slot=schedule_time_slot,
        priority=priority,
    )
    saved_paths = []
    for photo in photos:
        if photo.filename:
            ext = os.path.splitext(photo.filename)[1] or ".jpg"
            fname = f"{order.order_no}_{len(saved_paths)+1}{ext}"
            fpath = os.path.join(settings.upload_dir, fname)
            content = await photo.read()
            with open(fpath, "wb") as f:
                f.write(content)
            saved_paths.append(f"/uploads/{fname}")
    order.fault_photos = saved_paths
    region = db.query(Region).filter(Region.id == region_id).first() if region_id else None
    community = db.query(Community).filter(Community.id == community_id).first() if community_id else None
    order.full_address = build_full_address(
        region.name if region else None,
        community.name if community else None,
        address_detail
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    log_action(db, ActionType.CREATE_ORDER, "客户自助", order.id, {
        "order_no": order.order_no, "customer": customer_name, "photos": len(saved_paths)
    })
    return order


@router.put("/{order_id}", response_model=RepairOrderOut)
def update_order(order_id: int, data: RepairOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    old_status = order.status
    old_tech = order.technician_id
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if hasattr(v, "value"):
            v = v.value
        setattr(order, k, v)
    if data.status and data.status == OrderStatus.IN_PROGRESS and not order.started_at:
        order.started_at = datetime.utcnow()
    if data.status and data.status == OrderStatus.COMPLETED and not order.completed_at:
        order.completed_at = datetime.utcnow()
        if order.technician_id:
            t = db.query(Technician).filter(Technician.id == order.technician_id).first()
            if t:
                t.total_completed += 1
        from app.models import WorkRecord
        if order.technician_id and order.schedule_date:
            db.add(WorkRecord(
                order_id=order.id,
                technician_id=order.technician_id,
                work_date=order.schedule_date,
                community_id=order.community_id,
                hours_spent=1.0,
                status=OrderStatus.COMPLETED.value
            ))
    if data.status and data.status == OrderStatus.REFUNDED and not order.refunded_at:
        order.refunded_at = datetime.utcnow()
        log_action(db, ActionType.REFUND, "维修站长", order.id, {"amount": order.refund_amount})
    if data.technician_id and data.technician_id != old_tech:
        order.assigned_at = datetime.utcnow()
        log_action(db, ActionType.ASSIGN_TECHNICIAN, "维修站长", order.id, {
            "technician_id": data.technician_id
        })
    if data.status and data.status.value != old_status:
        log_action(db, ActionType.UPDATE_STATUS, "维修站长", order.id, {
            "from": old_status,
            "to": data.status.value
        })
    if data.schedule_date or data.schedule_time_slot:
        log_action(db, ActionType.SCHEDULE, "维修站长", order.id, {
            "schedule_date": data.schedule_date.isoformat() if data.schedule_date else None,
            "schedule_time_slot": data.schedule_time_slot
        })
    order.total_fee = (order.repair_fee or 0) + (order.parts_fee or 0)
    db.commit()
    db.refresh(order)
    return order
