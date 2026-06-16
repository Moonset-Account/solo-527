from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, datetime, timedelta
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..schemas.common import ResponseModel, PageResult

router = APIRouter(prefix="/api/dashboard", tags=["数据看板"])


@router.get("/summary", response_model=ResponseModel[schemas.DashboardSummary])
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    first_day_of_month = today.replace(day=1)

    total_amount = db.query(func.coalesce(func.sum(models.PurchaseOrder.grand_total), 0)).filter(
        models.PurchaseOrder.status.in_([
            models.PurchaseOrderStatus.CONFIRMED,
            models.PurchaseOrderStatus.PARTIAL_DELIVERED,
            models.PurchaseOrderStatus.DELIVERED,
            models.PurchaseOrderStatus.COMPLETED
        ])
    ).scalar()

    monthly_amount = db.query(func.coalesce(func.sum(models.PurchaseOrder.grand_total), 0)).filter(
        models.PurchaseOrder.created_at >= first_day_of_month,
        models.PurchaseOrder.status.in_([
            models.PurchaseOrderStatus.CONFIRMED,
            models.PurchaseOrderStatus.PARTIAL_DELIVERED,
            models.PurchaseOrderStatus.DELIVERED,
            models.PurchaseOrderStatus.COMPLETED
        ])
    ).scalar()

    total_orders = db.query(func.count(models.PurchaseOrder.id)).scalar()
    monthly_orders = db.query(func.count(models.PurchaseOrder.id)).filter(
        models.PurchaseOrder.created_at >= first_day_of_month
    ).scalar()

    pending_approval = db.query(func.count(models.PurchaseRequest.id)).filter(
        models.PurchaseRequest.status == models.PurchaseRequestStatus.SUBMITTED
    ).scalar()

    pending_delivery = db.query(func.count(models.PurchaseOrder.id)).filter(
        models.PurchaseOrder.status.in_([
            models.PurchaseOrderStatus.SENT,
            models.PurchaseOrderStatus.CONFIRMED,
            models.PurchaseOrderStatus.PARTIAL_DELIVERED
        ])
    ).scalar()

    overdue = db.query(func.count(models.PurchaseOrder.id)).filter(
        models.PurchaseOrder.expected_delivery_date < today,
        models.PurchaseOrder.status.notin_([
            models.PurchaseOrderStatus.DELIVERED,
            models.PurchaseOrderStatus.COMPLETED,
            models.PurchaseOrderStatus.CANCELLED
        ])
    ).scalar()

    avg_variance = db.query(func.coalesce(func.avg(models.QuoteComparison.price_variance_percent), 0)).scalar()

    cost_saving = db.query(func.coalesce(func.sum(
        models.QuoteComparison.historical_avg_price * 1
    ), 0)).scalar() - db.query(func.coalesce(func.sum(
        models.QuoteComparison.quote.has(models.Quote.unit_price)
    ), 0)).scalar() if False else 0

    high_risk = db.query(func.count(models.Supplier.id)).filter(
        models.Supplier.risk_level.in_([
            models.SupplierRiskLevel.HIGH,
            models.SupplierRiskLevel.CRITICAL
        ])
    ).scalar()

    active_agreements = db.query(func.count(models.FrameworkAgreement.id)).filter(
        models.FrameworkAgreement.status == models.AgreementStatus.ACTIVE
    ).scalar()

    summary = schemas.DashboardSummary(
        total_purchase_amount=float(total_amount or 0),
        monthly_purchase_amount=float(monthly_amount or 0),
        total_orders_count=int(total_orders or 0),
        monthly_orders_count=int(monthly_orders or 0),
        pending_approval_count=int(pending_approval or 0),
        pending_delivery_count=int(pending_delivery or 0),
        overdue_orders_count=int(overdue or 0),
        avg_price_variance=float(avg_variance or 0),
        cost_saving_amount=float(cost_saving or 0),
        high_risk_supplier_count=int(high_risk or 0),
        active_agreements_count=int(active_agreements or 0),
    )
    return ResponseModel(data=summary)


@router.get("/monthly-trend", response_model=ResponseModel[List[schemas.MonthlyPurchaseTrend]])
def get_monthly_trend(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    trends = []
    for i in range(months - 1, -1, -1):
        month_date = today.replace(day=1) - timedelta(days=i * 30)
        first_day = month_date.replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)

        amount = db.query(func.coalesce(func.sum(models.PurchaseOrder.grand_total), 0)).filter(
            models.PurchaseOrder.created_at >= first_day,
            models.PurchaseOrder.created_at <= last_day + timedelta(days=1),
            models.PurchaseOrder.status.in_([
                models.PurchaseOrderStatus.CONFIRMED,
                models.PurchaseOrderStatus.PARTIAL_DELIVERED,
                models.PurchaseOrderStatus.DELIVERED,
                models.PurchaseOrderStatus.COMPLETED
            ])
        ).scalar()

        count = db.query(func.count(models.PurchaseOrder.id)).filter(
            models.PurchaseOrder.created_at >= first_day,
            models.PurchaseOrder.created_at <= last_day + timedelta(days=1)
        ).scalar()

        trends.append(schemas.MonthlyPurchaseTrend(
            month=first_day.strftime("%Y-%m"),
            amount=float(amount or 0),
            order_count=int(count or 0)
        ))

    return ResponseModel(data=trends)


@router.get("/category-stats", response_model=ResponseModel[List[schemas.CategoryPurchaseStats]])
def get_category_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    stats = []
    total = db.query(func.coalesce(func.sum(models.PurchaseOrder.grand_total), 0)).scalar() or 0

    categories = db.query(models.MaterialCategory).all()
    for cat in categories:
        amount = db.query(func.coalesce(func.sum(models.PurchaseOrderItem.total), 0)).join(
            models.Material, models.Material.id == models.PurchaseOrderItem.material_id
        ).filter(
            models.Material.category_id == cat.id
        ).scalar() or 0
        pct = (amount / total * 100) if total > 0 else 0
        stats.append(schemas.CategoryPurchaseStats(
            category_id=cat.id,
            category_name=cat.name,
            amount=float(amount),
            percentage=float(pct)
        ))

    return ResponseModel(data=stats)


@router.get("/audit-logs", response_model=ResponseModel[PageResult[schemas.AuditLogInDB]])
def get_audit_logs(
    page: int = 1, page_size: int = 20,
    entity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.MANAGER, models.UserRole.ADMIN))
):
    filters = {}
    if entity_type: filters["entity_type"] = entity_type
    if user_id: filters["user_id"] = user_id
    if action: filters["action"] = action
    items, total = crud.audit_log.get_multi(
        db, page=page, page_size=page_size, filters=filters, order_by="created_at", order_dir="desc"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.get("/notifications", response_model=ResponseModel[PageResult[schemas.NotificationInDB]])
def get_notifications(
    page: int = 1, page_size: int = 20,
    status: Optional[models.NotificationStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    filters = {"user_id": current_user.id}
    if status: filters["status"] = status
    items, total = crud.notification.get_multi(
        db, page=page, page_size=page_size, filters=filters, order_by="created_at", order_dir="desc"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.put("/notifications/{notif_id}/read", response_model=ResponseModel[schemas.NotificationInDB])
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notif = crud.notification.get(db, notif_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="通知不存在")
    notif = crud.notification.update(db, notif, {
        "status": models.NotificationStatus.READ,
        "read_at": datetime.utcnow()
    })
    return ResponseModel(data=notif)
