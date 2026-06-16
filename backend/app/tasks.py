from celery import shared_task
from datetime import date, timedelta, datetime
from .database import SessionLocal
from . import models
from .utils import create_notification


@shared_task(name="app.tasks.check_delivery_alerts")
def check_delivery_alerts():
    db = SessionLocal()
    try:
        today = date.today()
        three_days_later = today + timedelta(days=3)

        pending_orders = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.status.notin_([
                models.PurchaseOrderStatus.DELIVERED,
                models.PurchaseOrderStatus.COMPLETED,
                models.PurchaseOrderStatus.CANCELLED
            ])
        ).all()

        for order in pending_orders:
            if order.expected_delivery_date:
                if order.expected_delivery_date < today:
                    pr = db.query(models.PurchaseRequest).filter(
                        models.PurchaseRequest.id == order.pr_id
                    ).first()
                    if pr and pr.project_owner_id:
                        create_notification(
                            db, pr.project_owner_id, models.AlertType.DELIVERY_DELAY,
                            f"订单延期提醒: {order.po_no}",
                            f"订单 {order.po_no} 已超过预计交货日期 {order.expected_delivery_date}",
                            "purchase_order", order.id
                        )
                elif order.expected_delivery_date <= three_days_later:
                    pr = db.query(models.PurchaseRequest).filter(
                        models.PurchaseRequest.id == order.pr_id
                    ).first()
                    if pr and pr.project_owner_id:
                        create_notification(
                            db, pr.project_owner_id, models.AlertType.DELIVERY_DATE_CHANGE,
                            f"订单即将到期: {order.po_no}",
                            f"订单 {order.po_no} 预计交货日期为 {order.expected_delivery_date}",
                            "purchase_order", order.id
                        )
        db.commit()
        return f"已检查 {len(pending_orders)} 个订单"
    finally:
        db.close()


@shared_task(name="app.tasks.check_quote_expiry")
def check_quote_expiry():
    db = SessionLocal()
    try:
        today = date.today()
        seven_days_later = today + timedelta(days=7)

        expiring_quotes = db.query(models.Quote).filter(
            models.Quote.status == models.QuoteStatus.ACCEPTED,
            models.Quote.valid_to >= today,
            models.Quote.valid_to <= seven_days_later
        ).all()

        procurement_users = db.query(models.User).filter(
            models.User.role.in_([models.UserRole.PROCUREMENT, models.UserRole.MANAGER])
        ).all()

        for quote in expiring_quotes:
            for user in procurement_users:
                create_notification(
                    db, user.id, models.AlertType.QUOTE_EXPIRING,
                    f"报价即将到期: {quote.quote_no}",
                    f"报价 {quote.quote_no} 有效期至 {quote.valid_to}",
                    "quote", quote.id
                )
        db.commit()
        return f"已检查 {len(expiring_quotes)} 个即将到期的报价"
    finally:
        db.close()


@shared_task(name="app.tasks.check_agreement_expiry")
def check_agreement_expiry():
    db = SessionLocal()
    try:
        today = date.today()
        thirty_days_later = today + timedelta(days=30)

        expiring_agreements = db.query(models.FrameworkAgreement).filter(
            models.FrameworkAgreement.status == models.AgreementStatus.ACTIVE,
            models.FrameworkAgreement.expiry_date >= today,
            models.FrameworkAgreement.expiry_date <= thirty_days_later
        ).all()

        procurement_users = db.query(models.User).filter(
            models.User.role.in_([models.UserRole.PROCUREMENT, models.UserRole.MANAGER, models.UserRole.ADMIN])
        ).all()

        for agreement in expiring_agreements:
            for user in procurement_users:
                create_notification(
                    db, user.id, models.AlertType.AGREEMENT_EXPIRING,
                    f"框架协议即将到期: {agreement.agreement_no}",
                    f"协议 {agreement.agreement_no} ({agreement.title}) 有效期至 {agreement.expiry_date}",
                    "framework_agreement", agreement.id
                )
        db.commit()
        return f"已检查 {len(expiring_agreements)} 个即将到期的框架协议"
    finally:
        db.close()


@shared_task(name="app.tasks.sync_dashboard_data")
def sync_dashboard_data():
    db = SessionLocal()
    try:
        from sqlalchemy import func
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

        high_risk = db.query(func.count(models.Supplier.id)).filter(
            models.Supplier.risk_level.in_([
                models.SupplierRiskLevel.HIGH,
                models.SupplierRiskLevel.CRITICAL
            ])
        ).scalar()

        active_agreements = db.query(func.count(models.FrameworkAgreement.id)).filter(
            models.FrameworkAgreement.status == models.AgreementStatus.ACTIVE
        ).scalar()

        record = models.DashboardRecord(
            record_date=today,
            total_purchase_amount=float(total_amount or 0),
            monthly_purchase_amount=float(monthly_amount or 0),
            total_orders_count=int(total_orders or 0),
            monthly_orders_count=int(monthly_orders or 0),
            pending_approval_count=int(pending_approval or 0),
            pending_delivery_count=int(pending_delivery or 0),
            overdue_orders_count=int(overdue or 0),
            avg_price_variance=float(avg_variance or 0),
            high_risk_supplier_count=int(high_risk or 0),
            active_agreements_count=int(active_agreements or 0),
        )
        db.add(record)
        db.commit()
        return f"已同步看板数据: {today}"
    finally:
        db.close()
