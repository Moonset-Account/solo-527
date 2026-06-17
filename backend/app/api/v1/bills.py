from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io

from app.core.database import get_db
from app.schemas.bill import (
    BillCreate, BillUpdate, BillBase, BillQuery,
    BillPaymentCreate, BillPaymentBase,
    BillGenerateRequest, CollectionProgressResponse,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import BillService, BillPaymentService

router = APIRouter(prefix="/bills", tags=["账单管理"])


@router.get("", response_model=ResponseModel[PageResult])
def list_bills(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    bill_type: Optional[str] = None,
    status: Optional[str] = None,
    lease_id: Optional[int] = None,
    bill_date_from: Optional[date] = None,
    bill_date_to: Optional[date] = None,
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:view")),
):
    query = BillQuery(
        page=page, page_size=page_size, keyword=keyword, bill_type=bill_type,
        status=status, lease_id=lease_id,
        bill_date_from=bill_date_from, bill_date_to=bill_date_to,
        due_date_from=due_date_from, due_date_to=due_date_to,
    )
    result = BillService.list(db, query)
    items = [BillBase.model_validate(b) for b in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("", response_model=ResponseModel[BillBase])
def create_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:manage")),
):
    bill = BillService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=BillBase.model_validate(bill))


@router.get("/{bill_id}", response_model=ResponseModel[BillBase])
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:view")),
):
    bill = BillService.get(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    return ResponseModel(data=BillBase.model_validate(bill))


@router.put("/{bill_id}", response_model=ResponseModel[BillBase])
def update_bill(
    bill_id: int,
    data: BillUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:manage")),
):
    bill = BillService.update(db, bill_id, data, updated_by=current_user.id)
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    return ResponseModel(data=BillBase.model_validate(bill))


@router.delete("/{bill_id}")
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:manage")),
):
    if not BillService.delete(db, bill_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="账单不存在")
    return ResponseModel(message="删除成功")


@router.post("/generate")
def generate_bills(
    data: BillGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:generate")),
):
    count = BillService.batch_generate(db, data, created_by=current_user.id)
    return ResponseModel(data={"count": count}, message=f"成功生成 {count} 条账单")


@router.get("/collection-progress", response_model=ResponseModel[CollectionProgressResponse])
def get_collection_progress(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:view")),
):
    progress = BillService.get_collection_progress(db)
    return ResponseModel(data=progress)


@router.get("/export/download")
def export_bills(
    keyword: Optional[str] = None,
    bill_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:export")),
):
    query = BillQuery(keyword=keyword, bill_type=bill_type, status=status)
    output = BillService.export_to_excel(db, query)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=bills.xlsx"},
    )


@router.get("/{bill_id}/payments", response_model=ResponseModel)
def list_bill_payments(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:view")),
):
    payments = BillPaymentService.list_by_bill(db, bill_id)
    items = [BillPaymentBase.model_validate(p) for p in payments]
    return ResponseModel(data=items)


@router.post("/payments", response_model=ResponseModel[BillPaymentBase])
def create_bill_payment(
    data: BillPaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:manage")),
):
    payment = BillPaymentService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=BillPaymentBase.model_validate(payment))


@router.delete("/payments/{payment_id}")
def delete_bill_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("bill:manage")),
):
    if not BillPaymentService.delete(db, payment_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="支付记录不存在")
    return ResponseModel(message="删除成功")
