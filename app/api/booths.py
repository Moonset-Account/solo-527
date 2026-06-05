from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import (
    User, Booth, BoothAssignment, BoothStatus, AssignmentStatus,
    VendorApplication, ApplicationStatus
)
from app.schemas.booth import (
    BoothCreate, BoothResponse, BoothAssignmentResponse,
    LotteryRequest, LotteryResult
)
from app.services.lottery_service import LotteryService
from app.tasks.background_tasks import send_lottery_notifications

router = APIRouter(prefix="/booths", tags=["摊位与抽签"])


@router.get("/", response_model=List[BoothResponse], dependencies=[Depends(PermissionRequired("manage_booths"))])
def list_booths(
    zone: str = None,
    status: BoothStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Booth)
    if zone:
        query = query.filter(Booth.zone == zone)
    if status:
        query = query.filter(Booth.status == status)
    return query.order_by(Booth.zone, Booth.position_order).offset(skip).limit(limit).all()


@router.post("/", response_model=BoothResponse, dependencies=[Depends(PermissionRequired("manage_booths"))])
def create_booth(
    booth_in: BoothCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Booth).filter(Booth.booth_number == booth_in.booth_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="摊位号已存在")
    booth = Booth(**booth_in.model_dump())
    db.add(booth)
    db.commit()
    db.refresh(booth)
    return booth


@router.post("/lottery/run", response_model=LotteryResult, dependencies=[Depends(PermissionRequired("run_lottery"))])
def run_lottery(
    request: LotteryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LotteryService(db)
    result = service.run_lottery(request.event_date, request.zone)

    if result.assignments:
        assignment_ids = [a.id for a in result.assignments]
        send_lottery_notifications.delay(assignment_ids)

    return result


@router.get("/assignments/", response_model=List[BoothAssignmentResponse], dependencies=[Depends(PermissionRequired("manage_booths"))])
def list_assignments(
    event_date: datetime = None,
    status: AssignmentStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BoothAssignment)
    if event_date:
        query = query.filter(BoothAssignment.event_date == event_date)
    if status:
        query = query.filter(BoothAssignment.status == status)
    return query.order_by(BoothAssignment.assigned_at.desc()).offset(skip).limit(limit).all()


@router.put("/assignments/{assignment_id}/confirm", response_model=BoothAssignmentResponse, dependencies=[Depends(PermissionRequired("manage_booths"))])
def confirm_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(BoothAssignment).filter(BoothAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="分配记录不存在")
    assignment.status = AssignmentStatus.CONFIRMED
    assignment.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)

    application = db.query(VendorApplication).filter(
        VendorApplication.id == assignment.application_id
    ).first()
    if application:
        application.status = ApplicationStatus.CONFIRMED
        db.commit()

    return assignment
