from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import (
    User, CheckinRecord, CheckinStatus, BoothAssignment,
    Vendor, Deposit, DepositStatus
)
from app.schemas.checkin import CheckinCreate, CheckinResponse, CheckinUpdate, SalesBackfill
from app.tasks.background_tasks import trigger_deposit_review_for_no_shows

router = APIRouter(prefix="/checkins", tags=["签到管理"])


@router.get("/", response_model=List[CheckinResponse], dependencies=[Depends(PermissionRequired("manage_checkins"))])
def list_checkins(
    event_date: datetime = None,
    status: CheckinStatus = None,
    vendor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CheckinRecord)
    if event_date:
        query = query.filter(CheckinRecord.event_date == event_date)
    if status:
        query = query.filter(CheckinRecord.status == status)
    if vendor_id:
        query = query.filter(CheckinRecord.vendor_id == vendor_id)
    return query.order_by(CheckinRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=CheckinResponse, dependencies=[Depends(PermissionRequired("manage_checkins"))])
def create_checkin(
    checkin_in: CheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(BoothAssignment).filter(
        BoothAssignment.id == checkin_in.assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="摊位分配记录不存在")
    
    existing = db.query(CheckinRecord).filter(
        CheckinRecord.assignment_id == checkin_in.assignment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该摊位分配已有签到记录")
    
    checkin = CheckinRecord(**checkin_in.model_dump())
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.post("/{checkin_id}/checkin", response_model=CheckinResponse, dependencies=[Depends(PermissionRequired("manage_checkins"))])
def do_checkin(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checkin = db.query(CheckinRecord).filter(CheckinRecord.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="签到记录不存在")
    
    checkin.status = CheckinStatus.CHECKED_IN
    checkin.checkin_time = datetime.utcnow()
    checkin.checked_in_by = current_user.id
    db.commit()
    db.refresh(checkin)
    return checkin


@router.put("/{checkin_id}/no-show", response_model=CheckinResponse, dependencies=[Depends(PermissionRequired("manage_checkins"))])
def mark_no_show(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checkin = db.query(CheckinRecord).filter(CheckinRecord.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="签到记录不存在")
    
    checkin.status = CheckinStatus.NO_SHOW
    db.commit()
    db.refresh(checkin)

    trigger_deposit_review_for_no_shows.delay(checkin.event_date.isoformat())
    
    return checkin


@router.put("/{checkin_id}/sales", response_model=CheckinResponse, dependencies=[Depends(PermissionRequired("backfill_sales"))])
def backfill_sales(
    checkin_id: int,
    sales_in: SalesBackfill,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checkin = db.query(CheckinRecord).filter(CheckinRecord.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="签到记录不存在")
    
    checkin.sales_amount = sales_in.sales_amount
    checkin.sales_notes = sales_in.sales_notes
    db.commit()
    db.refresh(checkin)
    return checkin


@router.post("/trigger-review/{event_date}", dependencies=[Depends(PermissionRequired("manage_checkins"))])
def trigger_deposit_review(
    event_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trigger_deposit_review_for_no_shows.delay(event_date)
    return {"message": "已触发保证金复核后台任务"}
