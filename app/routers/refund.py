import uuid
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Refund, Appointment, ProcessLog
from app.schemas import RefundCreate, Refund as RefundSchema

router = APIRouter()


def generate_refund_no():
    return f"RF{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"


@router.get("", response_model=List[RefundSchema])
def get_refunds(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    operator: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Refund)
    if start_date:
        query = query.filter(Refund.created_at >= start_date)
    if end_date:
        query = query.filter(Refund.created_at <= datetime.combine(end_date, datetime.max.time()))
    if status:
        query = query.filter(Refund.status == status)
    if operator:
        query = query.filter(Refund.operator == operator)
    return query.order_by(Refund.created_at.desc()).all()


@router.post("", response_model=RefundSchema)
def create_refund(refund: RefundCreate, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == refund.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="预约不存在")

    if refund.amount <= 0:
        raise HTTPException(status_code=400, detail="退款金额必须大于0")
    if refund.amount > appointment.price:
        raise HTTPException(status_code=400, detail="退款金额不能大于支付金额")

    refund_no = generate_refund_no()
    db_refund = Refund(
        **refund.model_dump(),
        refund_no=refund_no,
        status="pending"
    )
    db.add(db_refund)

    process_log = ProcessLog(
        appointment_id=appointment.id,
        action="退款申请",
        operator=refund.operator or "前台",
        detail=f"申请退款 {refund.amount} 元，原因：{refund.reason or '无'}"
    )
    db.add(process_log)

    db.commit()
    db.refresh(db_refund)
    return db_refund


@router.post("/{refund_id}/approve")
def approve_refund(
    refund_id: int,
    operator: Optional[str] = "管理员",
    db: Session = Depends(get_db)
):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="退款记录不存在")
    if refund.status != "pending":
        raise HTTPException(status_code=400, detail="该退款已处理")

    refund.status = "approved"
    refund.processed_at = datetime.now()

    appointment = db.query(Appointment).filter(Appointment.id == refund.appointment_id).first()
    if appointment:
        process_log = ProcessLog(
            appointment_id=appointment.id,
            action="退款通过",
            operator=operator,
            detail=f"退款 {refund.amount} 元已通过"
        )
        db.add(process_log)

    db.commit()
    return {"status": "success", "message": "退款已通过"}


@router.post("/{refund_id}/reject")
def reject_refund(
    refund_id: int,
    operator: Optional[str] = "管理员",
    reason: Optional[str] = None,
    db: Session = Depends(get_db)
):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="退款记录不存在")
    if refund.status != "pending":
        raise HTTPException(status_code=400, detail="该退款已处理")

    refund.status = "rejected"
    refund.processed_at = datetime.now()

    appointment = db.query(Appointment).filter(Appointment.id == refund.appointment_id).first()
    if appointment:
        process_log = ProcessLog(
            appointment_id=appointment.id,
            action="退款驳回",
            operator=operator,
            detail=f"退款被驳回，原因：{reason or '无'}"
        )
        db.add(process_log)

    db.commit()
    return {"status": "success", "message": "退款已驳回"}
