from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from decimal import Decimal
from app.database import get_db
from app import models
from app.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()

    total_medicines = db.query(func.count(models.Medicine.id)).filter(
        models.Medicine.is_active == True
    ).scalar() or 0

    total_batches = db.query(func.count(models.Batch.id)).filter(
        models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL])
    ).scalar() or 0

    total_stock_value = db.query(
        func.sum(models.Stock.quantity * models.Batch.purchase_price)
    ).join(models.Batch, models.Stock.batch_id == models.Batch.id).scalar() or Decimal(0)

    near_expiry_threshold = today + timedelta(days=90)
    near_expiry_count = db.query(func.count(models.Batch.id)).filter(
        models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL]),
        models.Batch.expiry_date <= near_expiry_threshold
    ).scalar() or 0

    meds_with_stock = db.query(
        models.Medicine,
        func.coalesce(func.sum(models.Stock.available_quantity), 0).label("stock")
    ).outerjoin(
        models.Batch, and_(
            models.Batch.medicine_id == models.Medicine.id,
            models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL])
        )
    ).outerjoin(
        models.Stock, models.Stock.batch_id == models.Batch.id
    ).filter(models.Medicine.is_active == True).group_by(models.Medicine.id).subquery()

    low_stock_count = db.query(func.count()).select_from(meds_with_stock).filter(
        meds_with_stock.c.stock < meds_with_stock.c.safety_stock
    ).scalar() or 0

    pending_reminders = db.query(func.count(models.ExpiryReminder.id)).filter(
        models.ExpiryReminder.status == models.ReminderStatus.PENDING
    ).scalar() or 0

    pending_risk = db.query(func.count(models.StockRisk.id)).filter(
        models.StockRisk.status == models.ReminderStatus.PENDING
    ).scalar() or 0

    abnormal_count = db.query(func.count(models.AbnormalRecord.id)).filter(
        models.AbnormalRecord.status.in_([
            models.AbnormalStatus.OPEN,
            models.AbnormalStatus.PROCESSING
        ])
    ).scalar() or 0

    return {
        "total_medicines": total_medicines,
        "total_batches": total_batches,
        "total_stock_value": float(total_stock_value),
        "near_expiry_count": near_expiry_count,
        "low_stock_count": low_stock_count,
        "pending_reminders": pending_reminders,
        "pending_risk": pending_risk,
        "abnormal_count": abnormal_count
    }


@router.get("/trends")
async def get_trends(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from datetime import datetime

    days = 7
    dates = [(date.today() - timedelta(days=i)).isoformat() for i in range(days-1, -1, -1)]

    inbound_data = []
    outbound_data = []
    for d in dates:
        start = datetime.fromisoformat(d)
        end = start + timedelta(days=1)
        inbound = db.query(func.sum(models.BatchFlow.quantity)).filter(
            models.BatchFlow.operation_time >= start,
            models.BatchFlow.operation_time < end,
            models.BatchFlow.flow_type.in_([
                models.FlowType.PURCHASE_IN,
                models.FlowType.TRANSFER_IN,
                models.FlowType.RETURN_IN
            ])
        ).scalar() or 0
        outbound = db.query(func.sum(models.BatchFlow.quantity)).filter(
            models.BatchFlow.operation_time >= start,
            models.BatchFlow.operation_time < end,
            models.BatchFlow.flow_type.in_([
                models.FlowType.SALES_OUT,
                models.FlowType.TRANSFER_OUT,
                models.FlowType.RETURN_OUT,
                models.FlowType.SCRAP
            ])
        ).scalar() or 0
        inbound_data.append(int(inbound))
        outbound_data.append(int(outbound))

    return {
        "dates": dates,
        "inbound": inbound_data,
        "outbound": outbound_data
    }
