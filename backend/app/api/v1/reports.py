from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, models
from ...config import settings

router = APIRouter()

allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])


@router.get("/dashboard", dependencies=[Depends(allow_admin_member)])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_reagents = crud.reagent.count(db, filters={"is_active": True})
    total_batches = crud.reagent_batch.count(db, filters={"is_active": True})
    low_stock_count = len(crud.reagent.get_low_stock(db))
    expiring_soon = len(crud.reagent_batch.get_expiring_soon(db, days=settings.EXPIRY_WARNING_DAYS))
    expired_count = len(crud.reagent_batch.get_expired(db))
    
    pending_requisitions = crud.requisition.count(
        db, filters={"status": models.RequisitionStatus.PENDING}
    )
    pending_confirmations = len(crud.requisition.get_pending_confirmation(db, user_id=current_user.id, limit=100))
    
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    requisitions_this_month = db.query(models.Requisition).filter(
        models.Requisition.created_at >= thirty_days_ago
    ).count()
    
    inventory_checks = crud.inventory_check.count(db)
    
    unread_notifications = crud.notification.count_unread(db, user_id=current_user.id)
    
    hazard_distribution = db.query(
        models.Reagent.hazard_level,
        func.count(models.Reagent.id)
    ).filter(
        models.Reagent.is_active == True
    ).group_by(models.Reagent.hazard_level).all()
    
    hazard_stats = {level.value: count for level, count in hazard_distribution}
    
    return {
        "overview": {
            "total_reagents": total_reagents,
            "total_batches": total_batches,
            "low_stock": low_stock_count,
            "expiring_soon": expiring_soon,
            "expired": expired_count,
            "pending_requisitions": pending_requisitions,
            "pending_confirmations": pending_confirmations,
            "requisitions_this_month": requisitions_this_month,
            "inventory_checks": inventory_checks,
            "unread_notifications": unread_notifications,
        },
        "hazard_distribution": hazard_stats,
        "low_stock_items": crud.reagent.get_low_stock(db)[:10],
        "expiring_items": crud.reagent_batch.get_expiring_soon(db)[:10],
    }


@router.get("/inventory-report", dependencies=[Depends(allow_admin_member)])
def get_inventory_report(
    category: models.ReagentCategory = None,
    hazard_level: models.HazardLevel = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batches = db.query(models.ReagentBatch).filter(
        models.ReagentBatch.is_active == True
    ).all()
    
    total_value = 0.0
    by_category = {}
    by_cabinet = {}
    
    for batch in batches:
        if category and batch.reagent.category != category:
            continue
        if hazard_level and batch.reagent.hazard_level != hazard_level:
            continue
        
        value = (batch.remaining_quantity or 0) * (batch.unit_price or 0)
        total_value += value
        
        cat = batch.reagent.category.value if batch.reagent else "unknown"
        by_category[cat] = by_category.get(cat, 0) + (batch.remaining_quantity or 0)
        
        cab = batch.storage_cabinet.name if batch.storage_cabinet else "未分配"
        by_cabinet[cab] = by_cabinet.get(cab, 0) + (batch.remaining_quantity or 0)
    
    return {
        "total_batches": len(batches),
        "total_value": round(total_value, 2),
        "by_category": by_category,
        "by_cabinet": by_cabinet,
    }


@router.get("/requisition-report", dependencies=[Depends(allow_admin_member)])
def get_requisition_report(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Requisition)
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(models.Requisition.created_at >= start)
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(models.Requisition.created_at < end)
    
    requisitions = query.all()
    
    status_stats = {}
    for req in requisitions:
        status = req.status.value
        status_stats[status] = status_stats.get(status, 0) + 1
    
    top_applicants = db.query(
        models.User.full_name,
        func.count(models.Requisition.id).label("count")
    ).join(
        models.Requisition, models.User.id == models.Requisition.applicant_id
    ).group_by(models.User.id).order_by(func.count(models.Requisition.id).desc()).limit(10).all()
    
    return {
        "total_requisitions": len(requisitions),
        "status_distribution": status_stats,
        "top_applicants": [{"name": name, "count": count} for name, count in top_applicants],
    }


@router.get("/export/inventory", dependencies=[Depends(allow_admin_member)])
def export_inventory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batches = db.query(models.ReagentBatch).filter(
        models.ReagentBatch.is_active == True
    ).all()
    
    data = []
    for batch in batches:
        data.append({
            "试剂名称": batch.reagent.name if batch.reagent else "未知",
            "CAS号": batch.reagent.cas_number if batch.reagent else "",
            "批号": batch.batch_number,
            "规格": batch.reagent.specification if batch.reagent else "",
            "单位": batch.reagent.unit if batch.reagent else "",
            "入库数量": batch.quantity,
            "剩余数量": batch.remaining_quantity,
            "生产日期": batch.production_date.isoformat() if batch.production_date else "",
            "有效期": batch.expiry_date.isoformat() if batch.expiry_date else "",
            "存放柜位": batch.storage_cabinet.name if batch.storage_cabinet else "",
            "货架位置": batch.shelf_position or "",
            "危险等级": batch.reagent.hazard_level.value if batch.reagent else "none",
            "制造商": batch.reagent.manufacturer if batch.reagent else "",
            "供应商": batch.reagent.supplier if batch.reagent else "",
            "条形码": batch.barcode,
        })
    
    return {"data": data, "total": len(data)}
