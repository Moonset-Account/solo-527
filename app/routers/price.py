from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from io import StringIO
import csv
from app.database import get_db
from app.schemas import (
    PriceRecordCreate, PriceRecordUpdate, PriceRecordResponse,
    PriceStats, PriceHistoryQuery, PaginatedResponse
)
from app.services import PriceService
from app.utils.security import get_current_user, require_role
from app.models import User, PriceRecord

router = APIRouter()


@router.get("/records", response_model=PaginatedResponse[PriceRecordResponse])
def get_price_history(
    material_name: Optional[str] = Query(None),
    specification: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = PriceHistoryQuery(
        material_name=material_name,
        specification=specification,
        start_date=start_date,
        end_date=end_date
    )
    items, total = PriceService.get_price_history(db, query, page, page_size)
    
    response_items = []
    for item in items:
        resp = PriceRecordResponse.model_validate(item)
        resp.supplier_name = item.supplier.name if item.supplier else None
        response_items.append(resp)
    
    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/records", response_model=PriceRecordResponse)
def create_price_record(
    price_in: PriceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    price = PriceService.create_price_record(db, price_in)
    resp = PriceRecordResponse.model_validate(price)
    resp.supplier_name = price.supplier.name if price.supplier else None
    return resp


@router.put("/records/{record_id}", response_model=PriceRecordResponse)
def update_price_record(
    record_id: int,
    price_in: PriceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    price = PriceService.update_price_record(db, record_id, price_in)
    resp = PriceRecordResponse.model_validate(price)
    resp.supplier_name = price.supplier.name if price.supplier else None
    return resp


@router.get("/stats", response_model=PriceStats)
def get_price_stats(
    material_name: str,
    specification: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PriceService.get_price_stats(db, material_name, specification)


@router.get("/expiring")
def get_expiring_prices(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager", "admin", "auditor"]))
):
    prices = PriceService.get_expiring_prices(db, days)
    return [
        {
            "id": p.id,
            "material_name": p.material_name,
            "specification": p.specification,
            "price": float(p.price),
            "supplier": p.supplier.name if p.supplier else None,
            "record_date": p.record_date.isoformat(),
            "expires_at": p.expires_at.isoformat() if p.expires_at else None,
            "purchase_id": p.purchase_id
        }
        for p in prices
    ]


@router.get("/trend")
def get_price_trend(
    material_name: str,
    specification: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PriceService.get_price_trend_data(db, material_name, specification, start_date, end_date)


@router.get("/materials")
def get_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PriceService.get_material_list(db)


@router.get("/supplier/{supplier_id}")
def get_supplier_prices(
    supplier_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = PriceService.get_supplier_prices(db, supplier_id, page, page_size)
    return {
        "items": [
            {
                "id": p.id,
                "material_name": p.material_name,
                "specification": p.specification,
                "price": float(p.price),
                "record_date": p.record_date.isoformat(),
                "expires_at": p.expires_at.isoformat() if p.expires_at else None,
                "is_expired": p.is_expired
            }
            for p in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/export")
def export_price_records(
    material_name: Optional[str] = Query(None),
    specification: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PriceRecord)
    
    if material_name:
        query = query.filter(PriceRecord.material_name.ilike(f"%{material_name}%"))
    if specification:
        query = query.filter(PriceRecord.specification.ilike(f"%{specification}%"))
    if start_date:
        query = query.filter(PriceRecord.record_date >= start_date)
    if end_date:
        query = query.filter(PriceRecord.record_date <= end_date)
    
    records = query.order_by(PriceRecord.record_date.desc()).all()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "材料名称", "规格型号", "供应商", "价格",
        "记录日期", "有效期至", "状态"
    ])
    
    for record in records:
        status = "已过期" if record.is_expired else "有效"
        supplier_name = record.supplier.name if record.supplier else "-"
        writer.writerow([
            record.material_name,
            record.specification or "-",
            supplier_name,
            float(record.price),
            record.record_date.isoformat(),
            record.expires_at.isoformat() if record.expires_at else "-",
            status
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=price_records_{date.today().isoformat()}.csv"
        }
    )
