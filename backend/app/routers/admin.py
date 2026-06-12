from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import (
    User, RepairOrder, AuditRecord, OperationHistory,
    NotificationReceipt, ClubActivity, SecondHandTrade, SeatViolation,
)
from app.schemas import (
    AuditAction, AuditRecordResponse, OperationHistoryResponse,
    NotificationReceiptResponse, ClubActivityResponse, SecondHandTradeResponse,
    SeatViolationResponse, RepairOrderResponse, StatisticsResponse,
)
from app.utils.permissions import get_current_user, require_role
from app.tasks import send_notification, calculate_statistics

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/repairs", response_model=list[RepairOrderResponse])
async def list_all_repairs(
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    query = db.query(RepairOrder)
    if status:
        query = query.filter(RepairOrder.status == status)
    if category:
        query = query.filter(RepairOrder.category == category)
    return query.order_by(RepairOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/repairs/{order_id}/audit", response_model=AuditRecordResponse, status_code=status.HTTP_201_CREATED)
async def audit_repair(
    order_id: int,
    audit: AuditAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair order not found")

    status_mapping = {
        "approve": "approved",
        "reject": "rejected",
        "assign": "in_progress",
        "complete": "completed",
    }

    old_status = order.status
    new_status = status_mapping.get(audit.action)
    if new_status:
        history = OperationHistory(
            order_id=order.id,
            operator_id=current_user.id,
            field_name="status",
            old_value=old_status,
            new_value=new_status,
        )
        db.add(history)
        order.status = new_status

    audit_record = AuditRecord(
        order_id=order.id,
        reviewer_id=current_user.id,
        action=audit.action,
        comment=audit.comment,
    )
    db.add(audit_record)
    db.commit()
    db.refresh(audit_record)

    from datetime import datetime as dt
    from app.models import NotificationReceipt as NR

    notification_content = f"您的报修工单 #{order.id} 已被{audit.action}。"
    if audit.comment:
        notification_content += f" 备注：{audit.comment}"

    receipt = NR(
        user_id=order.student_id,
        order_id=order.id,
        channel="in_app",
        content=notification_content,
        is_read=False,
        sent_at=dt.utcnow(),
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)

    try:
        send_notification.delay(
            user_id=order.student_id,
            order_id=order.id,
            channel="in_app",
            content=notification_content,
        )
    except Exception:
        pass

    return audit_record


@router.get("/repairs/{order_id}/history", response_model=list[OperationHistoryResponse])
async def get_repair_history(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair order not found")

    return db.query(OperationHistory).filter(OperationHistory.order_id == order_id).order_by(OperationHistory.created_at.desc()).all()


@router.get("/notifications", response_model=list[NotificationReceiptResponse])
async def list_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    return db.query(NotificationReceipt).order_by(NotificationReceipt.sent_at.desc()).offset(skip).limit(limit).all()


@router.get("/club-activities", response_model=list[ClubActivityResponse])
async def list_club_activities(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    return db.query(ClubActivity).order_by(ClubActivity.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/second-hand", response_model=list[SecondHandTradeResponse])
async def list_second_hand(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    return db.query(SecondHandTrade).order_by(SecondHandTrade.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/seat-violations", response_model=list[SeatViolationResponse])
async def list_seat_violations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    return db.query(SeatViolation).order_by(SeatViolation.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    try:
        result = calculate_statistics.delay()
        stats = result.get(timeout=5)
        return StatisticsResponse(**stats)
    except Exception:
        from sqlalchemy import func
        total = db.query(func.count(RepairOrder.id)).scalar()
        pending = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "pending").scalar()
        in_progress = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "in_progress").scalar()
        completed = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "completed").scalar()
        return StatisticsResponse(
            total_orders=total,
            pending_orders=pending,
            in_progress_orders=in_progress,
            completed_orders=completed,
        )
