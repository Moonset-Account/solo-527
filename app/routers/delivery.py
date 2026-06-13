from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.database import get_db
from app.schemas import (
    DeliveryRecordCreate, DeliveryRecordUpdate, DeliveryRecordResponse,
    DeliveryStats, PaginatedResponse
)
from app.services import DeliveryService
from app.utils.security import get_current_user, require_role
from app.models import User

router = APIRouter()


@router.get("", response_model=PaginatedResponse[DeliveryRecordResponse])
def get_delivery_list(
    purchase_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = DeliveryService.get_delivery_list(
        db, purchase_id, start_date, end_date, page, page_size
    )
    
    response_items = []
    for item in items:
        resp = DeliveryRecordResponse.model_validate(item)
        resp.purchase_request_no = item.purchase.request_no if item.purchase else None
        resp.material_name = item.purchase.material_name if item.purchase else None
        resp.expected_quantity = item.purchase.quantity if item.purchase else None
        if item.purchase:
            resp.quantity_diff = item.delivered_quantity - item.purchase.quantity
        diffs = DeliveryService.get_delivery_diffs(db, item.id)
        resp.diffs = [
            {
                "id": d.id,
                "diff_type": d.diff_type,
                "diff_value": float(d.diff_value),
                "description": d.description
            }
            for d in diffs
        ]
        response_items.append(resp)
    
    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("", response_model=DeliveryRecordResponse)
def create_delivery(
    delivery_in: DeliveryRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    delivery = DeliveryService.create_delivery(db, delivery_in, current_user)
    resp = DeliveryRecordResponse.model_validate(delivery)
    resp.purchase_request_no = delivery.purchase.request_no if delivery.purchase else None
    resp.material_name = delivery.purchase.material_name if delivery.purchase else None
    resp.expected_quantity = delivery.purchase.quantity if delivery.purchase else None
    if delivery.purchase:
        resp.quantity_diff = delivery.delivered_quantity - delivery.purchase.quantity
    return resp


@router.get("/{delivery_id}", response_model=DeliveryRecordResponse)
def get_delivery_detail(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delivery = DeliveryService.get_delivery_detail(db, delivery_id)
    resp = DeliveryRecordResponse.model_validate(delivery)
    resp.purchase_request_no = delivery.purchase.request_no if delivery.purchase else None
    resp.material_name = delivery.purchase.material_name if delivery.purchase else None
    resp.expected_quantity = delivery.purchase.quantity if delivery.purchase else None
    if delivery.purchase:
        resp.quantity_diff = delivery.delivered_quantity - delivery.purchase.quantity
    diffs = DeliveryService.get_delivery_diffs(db, delivery.id)
    resp.diffs = [
        {
            "id": d.id,
            "diff_type": d.diff_type,
            "diff_value": float(d.diff_value),
            "description": d.description
        }
        for d in diffs
    ]
    return resp


@router.put("/{delivery_id}", response_model=DeliveryRecordResponse)
def update_delivery(
    delivery_id: int,
    delivery_in: DeliveryRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    delivery = DeliveryService.update_delivery(db, delivery_id, delivery_in, current_user)
    resp = DeliveryRecordResponse.model_validate(delivery)
    resp.purchase_request_no = delivery.purchase.request_no if delivery.purchase else None
    resp.material_name = delivery.purchase.material_name if delivery.purchase else None
    resp.expected_quantity = delivery.purchase.quantity if delivery.purchase else None
    if delivery.purchase:
        resp.quantity_diff = delivery.delivered_quantity - delivery.purchase.quantity
    return resp


@router.get("/stats/summary", response_model=DeliveryStats)
def get_delivery_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager", "admin", "auditor"]))
):
    return DeliveryService.get_delivery_stats(db)


@router.get("/purchase/{purchase_id}", response_model=list[DeliveryRecordResponse])
def get_purchase_deliveries(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deliveries = DeliveryService.get_purchase_deliveries(db, purchase_id)
    result = []
    for delivery in deliveries:
        resp = DeliveryRecordResponse.model_validate(delivery)
        diffs = DeliveryService.get_delivery_diffs(db, delivery.id)
        resp.diffs = [
            {
                "id": d.id,
                "diff_type": d.diff_type,
                "diff_value": float(d.diff_value),
                "description": d.description
            }
            for d in diffs
        ]
        result.append(resp)
    return result


@router.post("/sync/{purchase_id}")
def sync_delivery_status(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    purchase = DeliveryService.sync_delivery_status(db, purchase_id, current_user)
    return {
        "success": True,
        "data": {
            "purchase_id": purchase.id,
            "status": purchase.status.value if hasattr(purchase.status, 'value') else purchase.status
        }
    }


@router.get("/stats/diff-types")
def get_diff_type_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DeliveryService.get_diff_type_stats(db)


@router.get("/stats/monthly")
def get_monthly_delivery_data(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DeliveryService.get_monthly_delivery_data(db, months)


@router.get("/export")
def export_delivery_records(
    purchase_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from io import StringIO
    import csv
    from fastapi.responses import StreamingResponse
    
    items, _ = DeliveryService.get_delivery_list(
        db, purchase_id, start_date, end_date, page=1, page_size=1000
    )
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "采购单号", "材料名称", "预期数量", "已交付数量", "数量差异",
        "交付日期", "发票状态", "备注"
    ])
    
    for item in items:
        purchase = item.purchase
        purchase_no = purchase.request_no if purchase else "-"
        material_name = purchase.material_name if purchase else "-"
        expected_qty = float(purchase.quantity) if purchase else 0
        diff_qty = float(item.delivered_quantity) - expected_qty
        
        writer.writerow([
            purchase_no,
            material_name,
            expected_qty,
            float(item.delivered_quantity),
            diff_qty,
            item.delivery_date.isoformat(),
            item.invoice_status_code or "-",
            item.remark or "-"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=delivery_records_{date.today().isoformat()}.csv"
        }
    )
