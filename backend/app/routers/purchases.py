from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..utils import create_audit_log, create_notification
from ..schemas.common import ResponseModel, PageResult

router = APIRouter(prefix="/api/purchases", tags=["采购管理"])


def generate_pr_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    last = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.pr_no.like(f"PR{today}%")).order_by(models.PurchaseRequest.pr_no.desc()).first()
    seq = int(last.pr_no[-4:]) + 1 if last else 1
    return f"PR{today}{seq:04d}"


def generate_po_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    last = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.po_no.like(f"PO{today}%")).order_by(models.PurchaseOrder.po_no.desc()).first()
    seq = int(last.po_no[-4:]) + 1 if last else 1
    return f"PO{today}{seq:04d}"


@router.get("/requests", response_model=ResponseModel[PageResult[schemas.PurchaseRequestInDB]])
def list_purchase_requests(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    status: Optional[models.PurchaseRequestStatus] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if status: filters["status"] = status
    if department: filters["department"] = department
    items, total = crud.purchase_request.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["pr_no", "title", "project_name"], filters=filters, order_by="id",
        includes=["items"]
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("/requests", response_model=ResponseModel[schemas.PurchaseRequestInDB])
def create_purchase_request(
    pr_in: schemas.PurchaseRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    pr_data = pr_in.model_dump(exclude={"items"})
    pr_data["pr_no"] = generate_pr_no(db)
    pr_data["created_by"] = current_user.id
    total_amount = 0
    for item in pr_in.items:
        total_amount += item.unit_price * item.quantity
    pr_data["total_estimated_amount"] = total_amount
    pr = crud.purchase_request.create(db, obj_in=pr_data)

    for item_in in pr_in.items:
        item_data = item_in.model_dump()
        item_data["pr_id"] = pr.id
        subtotal = item_in.unit_price * item_in.quantity
        item_data["subtotal"] = subtotal
        item_data["tax_amount"] = subtotal * (item_in.quote_id and 0.13 or 0)
        item_data["total"] = subtotal + item_data["tax_amount"]
        crud.purchase_order_item.create(db, obj_in=item_data)

    db.refresh(pr)
    create_audit_log(db, "create", "purchase_request", pr.id, pr.pr_no, current_user,
                     new_value=pr_in.model_dump(), description="创建采购需求")
    return ResponseModel(data=pr)


@router.get("/requests/{pr_id}", response_model=ResponseModel[schemas.PurchaseRequestInDB])
def get_purchase_request(pr_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pr = crud.purchase_request.get(db, pr_id, includes=["items"])
    if not pr:
        raise HTTPException(status_code=404, detail="采购需求不存在")
    return ResponseModel(data=pr)


@router.put("/requests/{pr_id}", response_model=ResponseModel[schemas.PurchaseRequestInDB])
def update_purchase_request(
    pr_id: int, pr_in: schemas.PurchaseRequestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    pr = crud.purchase_request.get(db, pr_id)
    if not pr:
        raise HTTPException(status_code=404, detail="采购需求不存在")
    update_data = pr_in.model_dump(exclude_unset=True)
    if pr_in.status == models.PurchaseRequestStatus.APPROVED:
        update_data["approved_by"] = current_user.id
        update_data["approved_at"] = datetime.utcnow()
    pr = crud.purchase_request.update(db, pr, update_data)
    create_audit_log(db, "update", "purchase_request", pr.id, pr.pr_no, current_user,
                     new_value=pr_in.model_dump(exclude_unset=True), description="更新采购需求状态")
    return ResponseModel(data=pr)


@router.get("/orders", response_model=ResponseModel[PageResult[schemas.PurchaseOrderInDB]])
def list_purchase_orders(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    status: Optional[models.PurchaseOrderStatus] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if status: filters["status"] = status
    if supplier_id: filters["supplier_id"] = supplier_id
    items, total = crud.purchase_order.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["po_no"], filters=filters, order_by="id",
        includes=["items", "purchase_request", "supplier"]
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("/orders", response_model=ResponseModel[schemas.PurchaseOrderInDB])
def create_purchase_order(
    po_in: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    po_data = po_in.model_dump(exclude={"items"})
    po_data["po_no"] = generate_po_no(db)
    po_data["created_by"] = current_user.id

    total_amount = 0
    tax_amount = 0
    for item in po_in.items:
        subtotal = item.unit_price * item.quantity
        total_amount += subtotal
        tax_amount += subtotal * 0.13
    po_data["total_amount"] = total_amount
    po_data["tax_amount"] = tax_amount
    po_data["grand_total"] = total_amount + tax_amount

    po = crud.purchase_order.create(db, obj_in=po_data)

    for item_in in po_in.items:
        item_data = item_in.model_dump()
        item_data["po_id"] = po.id
        subtotal = item_in.unit_price * item_in.quantity
        item_data["subtotal"] = subtotal
        item_data["tax_amount"] = subtotal * 0.13
        item_data["total"] = subtotal + item_data["tax_amount"]
        crud.purchase_order_item.create(db, obj_in=item_data)

    supplier = crud.supplier.get(db, po_in.supplier_id)
    if supplier:
        supplier.total_orders += 1
        supplier.total_amount += po_data["grand_total"]
        db.commit()

    db.refresh(po)
    create_audit_log(db, "create", "purchase_order", po.id, po.po_no, current_user,
                     new_value=po_in.model_dump(), description="创建采购订单")
    return ResponseModel(data=po)


@router.get("/orders/{po_id}", response_model=ResponseModel[schemas.PurchaseOrderInDB])
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    po = crud.purchase_order.get(db, po_id, includes=["items", "purchase_request", "supplier"])
    if not po:
        raise HTTPException(status_code=404, detail="采购订单不存在")
    return ResponseModel(data=po)


@router.put("/orders/{po_id}", response_model=ResponseModel[schemas.PurchaseOrderInDB])
def update_purchase_order(
    po_id: int, po_in: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    po = crud.purchase_order.get(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="采购订单不存在")

    old_expected = po.expected_delivery_date
    update_data = po_in.model_dump(exclude_unset=True)

    if po_in.status == models.PurchaseOrderStatus.SENT:
        update_data["sent_at"] = datetime.utcnow()
    elif po_in.status == models.PurchaseOrderStatus.CONFIRMED:
        update_data["confirmed_at"] = datetime.utcnow()
    elif po_in.status == models.PurchaseOrderStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
        if po.expected_delivery_date and po.actual_delivery_date:
            delivery_days = (po.actual_delivery_date - po.expected_delivery_date).days
            update_data["delivery_days_actual"] = delivery_days

    po = crud.purchase_order.update(db, po, update_data)

    if po_in.expected_delivery_date and old_expected != po_in.expected_delivery_date:
        pr = crud.purchase_request.get(db, po.pr_id)
        if pr and pr.project_owner_id:
            alert = models.DeliveryAlert(
                po_id=po.id, po_no=po.po_no,
                old_expected_date=old_expected,
                new_expected_date=po_in.expected_delivery_date,
                project_owner_id=pr.project_owner_id,
                reason=po_in.remarks or "交期变更"
            )
            db.add(alert)
            db.commit()
            create_notification(db, pr.project_owner_id, models.AlertType.DELIVERY_DATE_CHANGE,
                                f"交期变更提醒: {po.po_no}",
                                f"交期从 {old_expected} 变更为 {po_in.expected_delivery_date}",
                                "purchase_order", po.id)

    create_audit_log(db, "update", "purchase_order", po.id, po.po_no, current_user,
                     new_value=po_in.model_dump(exclude_unset=True), description="更新采购订单")
    return ResponseModel(data=po)
