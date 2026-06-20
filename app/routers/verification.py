from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime, timedelta

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin, allow_manager
from app.models import (
    Verification, TreatmentCard, Customer, Treatment, User,
    VerificationStatus, TreatmentCardStatus, PaymentRecord, PaymentStatus,
    Message, MessageType, Todo, TodoStatus, ReminderRule
)
from app.config import settings
from app.htmx_utils import is_htmx, get_page
from app.templates import templates

router = APIRouter(prefix="/api", tags=["核销与收银"])


class VerificationCreate(BaseModel):
    customer_id: int
    treatment_card_id: int
    sessions_used: int = 1
    note: str = ""


@router.get("/verifications")
def list_verifications(
    request: Request,
    status: Optional[VerificationStatus] = None,
    customer_keyword: Optional[str] = None,
    operator_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    skip = (page - 1) * limit
    query = db.query(Verification).join(Customer).join(Treatment).join(User, Verification.operator_id == User.id)
    if status:
        query = query.filter(Verification.status == status)
    if customer_keyword or keyword:
        kw = customer_keyword or keyword
        query = query.filter(
            or_(
                Customer.name.contains(kw),
                Customer.phone.contains(kw),
                Verification.verification_no.contains(kw)
            )
        )
    if operator_id:
        query = query.filter(Verification.operator_id == operator_id)
    if start_date:
        query = query.filter(Verification.verification_time >= start_date)
    if end_date:
        query = query.filter(Verification.verification_time < end_date + timedelta(days=1))

    total = query.count()
    verifications = query.order_by(desc(Verification.verification_time)).offset(skip).limit(limit).all()
    items = []
    for v in verifications:
        items.append({
            "id": v.id,
            "verification_no": v.verification_no,
            "customer_id": v.customer_id,
            "customer_name": v.customer.name,
            "customer_phone": v.customer.phone,
            "treatment_name": v.treatment.name,
            "treatment_card_id": v.treatment_card_id,
            "sessions_used": v.sessions_used,
            "operator_name": v.operator.full_name,
            "status": v.status.value,
            "verification_time": v.verification_time,
            "note": v.note
        })
    
    if is_htmx(request):
        total_pages = (total + limit - 1) // limit
        query_params = {
            "status": status.value if status else "",
            "operator_id": operator_id or "",
            "start_date": start_date.isoformat() if start_date else "",
            "end_date": end_date.isoformat() if end_date else "",
            "keyword": keyword or "",
            "limit": limit
        }
        return templates.TemplateResponse(
            "partials/verification_list.html",
            {
                "request": request,
                "items": items,
                "total": total,
                "current_page": page,
                "total_pages": total_pages,
                "query_params": query_params,
                "hx_endpoint": "list_verifications",
                "hx_target": "#verification-table-container",
                "hx_include": "#verification-filters"
            }
        )
    
    return {"total": total, "items": items}


@router.post("/verifications")
async def create_verification(
    request: Request,
    customer_id: Optional[int] = None,
    treatment_card_id: Optional[int] = None,
    sessions_used: int = 1,
    note: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
        if form.get("customer_id"):
            customer_id = int(form.get("customer_id"))
        if form.get("treatment_card_id"):
            treatment_card_id = int(form.get("treatment_card_id"))
        if form.get("sessions_used"):
            sessions_used = int(form.get("sessions_used"))
        if form.get("note"):
            note = form.get("note")
    elif content_type.startswith("application/json"):
        try:
            import json
            body = await request.json()
            customer_id = body.get("customer_id", customer_id)
            treatment_card_id = body.get("treatment_card_id", treatment_card_id)
            sessions_used = body.get("sessions_used", sessions_used)
            note = body.get("note", note)
        except Exception:
            pass
    
    if not customer_id or not treatment_card_id:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">请选择顾客和疗程卡</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="请选择顾客和疗程卡")

    card = db.query(TreatmentCard).filter(TreatmentCard.id == treatment_card_id).first()
    if not card:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">疗程卡不存在</div>',
                status_code=404
            )
        raise HTTPException(status_code=404, detail="疗程卡不存在")
    if card.status != TreatmentCardStatus.ACTIVE:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">疗程卡状态不可用</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="疗程卡状态不可用")
    if card.remaining_sessions < sessions_used:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">剩余次数不足</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="剩余次数不足")

    import uuid
    verification_no = f"VX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

    verification = Verification(
        verification_no=verification_no,
        customer_id=customer_id,
        treatment_card_id=treatment_card_id,
        treatment_id=card.treatment_id,
        operator_id=current_user.id,
        sessions_used=sessions_used,
        status=VerificationStatus.VERIFIED,
        note=note
    )
    db.add(verification)

    card.remaining_sessions -= sessions_used
    if card.remaining_sessions <= 0:
        card.status = TreatmentCardStatus.USED_UP

    db.commit()
    db.refresh(verification)

    if is_htmx(request):
        from app.routers.verification import list_verifications
        return list_verifications(
            request=request,
            page=1,
            limit=10,
            db=db,
            current_user=current_user
        )
    
    return verification


@router.get("/verifications/{verification_id}")
def get_verification(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    v = db.query(Verification).filter(Verification.id == verification_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="核销记录不存在")
    return {
        "id": v.id,
        "verification_no": v.verification_no,
        "customer_id": v.customer_id,
        "customer_name": v.customer.name,
        "customer_phone": v.customer.phone,
        "treatment_name": v.treatment.name,
        "treatment_card_id": v.treatment_card_id,
        "card_no": v.treatment_card.card_no,
        "sessions_used": v.sessions_used,
        "operator_name": v.operator.full_name,
        "status": v.status.value,
        "verification_time": v.verification_time,
        "note": v.note
    }


class PaymentCreate(BaseModel):
    customer_id: Optional[int] = None
    treatment_card_id: Optional[int] = None
    amount: float
    actual_amount: float
    payment_method: str = "cash"
    payment_type: str = "card_purchase"
    note: str = ""


@router.get("/payments")
def list_payments(
    request: Request,
    status: Optional[PaymentStatus] = None,
    customer_keyword: Optional[str] = None,
    cashier_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    keyword: Optional[str] = None,
    payment_method: Optional[str] = None,
    has_diff: Optional[bool] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    skip = (page - 1) * limit
    query = db.query(PaymentRecord).outerjoin(Customer).join(User, PaymentRecord.cashier_id == User.id)
    if status:
        query = query.filter(PaymentRecord.status == status)
    if customer_keyword or keyword:
        kw = customer_keyword or keyword
        query = query.filter(
            or_(
                Customer.name.contains(kw),
                Customer.phone.contains(kw),
                PaymentRecord.payment_no.contains(kw)
            )
        )
    if cashier_id:
        query = query.filter(PaymentRecord.cashier_id == cashier_id)
    if start_date:
        query = query.filter(PaymentRecord.payment_time >= start_date)
    if end_date:
        query = query.filter(PaymentRecord.payment_time < end_date + timedelta(days=1))
    if payment_method:
        query = query.filter(PaymentRecord.payment_method == payment_method)
    if has_diff is not None:
        if has_diff:
            query = query.filter(PaymentRecord.diff_amount != 0)
        else:
            query = query.filter(PaymentRecord.diff_amount == 0)

    total = query.count()
    payments = query.order_by(desc(PaymentRecord.payment_time)).offset(skip).limit(limit).all()
    items = []
    for p in payments:
        items.append({
            "id": p.id,
            "payment_no": p.payment_no,
            "customer_name": p.customer.name if p.customer else "散客",
            "customer_phone": p.customer.phone if p.customer else "",
            "amount": p.amount,
            "actual_amount": p.actual_amount,
            "diff_amount": p.diff_amount,
            "payment_method": p.payment_method,
            "payment_type": p.payment_type,
            "cashier_name": p.cashier.full_name,
            "status": p.status.value,
            "payment_time": p.payment_time,
            "note": p.note
        })
    
    if is_htmx(request):
        total_pages = (total + limit - 1) // limit
        return templates.TemplateResponse(
            "partials/payment_list.html",
            {
                "request": request,
                "items": items,
                "total": total,
                "current_page": page,
                "total_pages": total_pages
            }
        )
    
    return {"total": total, "items": items}


@router.post("/payments")
async def create_payment(
    request: Request,
    customer_id: Optional[int] = None,
    treatment_card_id: Optional[int] = None,
    amount: Optional[float] = None,
    actual_amount: Optional[float] = None,
    payment_method: str = "cash",
    payment_type: str = "card_purchase",
    note: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
        if form.get("customer_id"):
            customer_id = int(form.get("customer_id"))
        if form.get("treatment_card_id"):
            treatment_card_id = int(form.get("treatment_card_id"))
        if form.get("amount"):
            amount = float(form.get("amount"))
        if form.get("actual_amount"):
            actual_amount = float(form.get("actual_amount"))
        if form.get("payment_method"):
            payment_method = form.get("payment_method")
        if form.get("payment_type"):
            payment_type = form.get("payment_type")
        if form.get("note"):
            note = form.get("note")
    elif content_type.startswith("application/json"):
        try:
            import json
            body = await request.json()
            customer_id = body.get("customer_id", customer_id)
            treatment_card_id = body.get("treatment_card_id", treatment_card_id)
            amount = body.get("amount", amount)
            actual_amount = body.get("actual_amount", actual_amount)
            payment_method = body.get("payment_method", payment_method)
            payment_type = body.get("payment_type", payment_type)
            note = body.get("note", note)
        except Exception:
            pass
    
    if amount is None or actual_amount is None:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">请填写金额</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="amount and actual_amount are required")

    import uuid
    payment_no = f"SK{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

    diff_amount = actual_amount - amount

    payment = PaymentRecord(
        payment_no=payment_no,
        customer_id=customer_id,
        treatment_card_id=treatment_card_id,
        cashier_id=current_user.id,
        amount=amount,
        actual_amount=actual_amount,
        diff_amount=diff_amount,
        payment_method=payment_method,
        payment_type=payment_type,
        status=PaymentStatus.PAID,
        note=note
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    rules = db.query(ReminderRule).filter(
        ReminderRule.rule_type == "cash_diff",
        ReminderRule.is_active == True
    ).order_by(ReminderRule.threshold_value.desc()).all()

    abs_diff = abs(diff_amount)
    for rule in rules:
        if abs_diff >= float(rule.threshold_value):
            if rule.is_alert:
                todo = Todo(
                    title=f"收银差异告警: {payment_no}",
                    description=f"收银单号 {payment_no} 差异金额 {diff_amount} 元，超过告警阈值 {rule.threshold_value} 元，请立即核查。规则：{rule.name}",
                    priority="high",
                    status=TodoStatus.PENDING,
                    related_type="payment",
                    related_id=payment.id
                )
                db.add(todo)
            else:
                msg = Message(
                    title=f"收银差异提醒: {payment_no}",
                    content=f"收银单号 {payment_no} 差异金额 {diff_amount} 元，请注意核查。规则：{rule.name}",
                    type=MessageType.WARNING,
                    related_type="payment",
                    related_id=payment.id
                )
                db.add(msg)
            break

    db.commit()

    if is_htmx(request):
        return list_payments(
            request=request,
            page=1,
            limit=10,
            db=db,
            current_user=current_user
        )
    
    return payment


@router.get("/payments/stats")
def payment_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_manager)
):
    from sqlalchemy import func
    query = db.query(PaymentRecord).filter(PaymentRecord.status == PaymentStatus.PAID)
    if start_date:
        query = query.filter(PaymentRecord.payment_time >= start_date)
    if end_date:
        query = query.filter(PaymentRecord.payment_time < end_date + timedelta(days=1))

    total_amount = query.with_entities(func.sum(PaymentRecord.amount)).scalar() or 0
    total_actual = query.with_entities(func.sum(PaymentRecord.actual_amount)).scalar() or 0
    total_diff = query.with_entities(func.sum(PaymentRecord.diff_amount)).scalar() or 0
    count = query.count()

    diff_count = query.filter(PaymentRecord.diff_amount != 0).count()

    alert_rule = db.query(ReminderRule).filter(
        ReminderRule.rule_type == "cash_diff",
        ReminderRule.is_alert == True,
        ReminderRule.is_active == True
    ).order_by(ReminderRule.threshold_value.asc()).first()
    alert_threshold = float(alert_rule.threshold_value) if alert_rule else 200.0

    alert_count = query.filter(
        func.abs(PaymentRecord.diff_amount) >= alert_threshold
    ).count()

    return {
        "total_amount": total_amount,
        "total_actual": total_actual,
        "total_diff": total_diff,
        "count": count,
        "diff_count": diff_count,
        "alert_count": alert_count
    }
