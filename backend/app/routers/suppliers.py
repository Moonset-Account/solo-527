from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..utils import create_audit_log, create_notification
from ..schemas.common import ResponseModel, PageResult

router = APIRouter(prefix="/api/suppliers", tags=["供应商管理"])


@router.get("", response_model=ResponseModel[PageResult[schemas.SupplierInDB]])
def list_suppliers(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    risk_level: Optional[models.SupplierRiskLevel] = None,
    status: Optional[models.SupplierStatus] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if risk_level: filters["risk_level"] = risk_level
    if status: filters["status"] = status
    items, total = crud.supplier.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["name", "code", "contact_person", "phone", "email"],
        filters=filters, order_by="id"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("", response_model=ResponseModel[schemas.SupplierInDB])
def create_supplier(
    sup_in: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    sup_data = sup_in.model_dump()
    sup_data["created_by"] = current_user.id
    sup = crud.supplier.create(db, obj_in=sup_data)
    create_audit_log(db, "create", "supplier", sup.id, sup.name, current_user,
                     new_value=sup_in.model_dump(), description="创建供应商")
    return ResponseModel(data=sup)


@router.get("/{supplier_id}", response_model=ResponseModel[schemas.SupplierInDB])
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sup = crud.supplier.get(db, supplier_id)
    if not sup:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return ResponseModel(data=sup)


@router.put("/{supplier_id}", response_model=ResponseModel[schemas.SupplierInDB])
def update_supplier(
    supplier_id: int, sup_in: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    sup = crud.supplier.get(db, supplier_id)
    if not sup:
        raise HTTPException(status_code=404, detail="供应商不存在")
    old_data = {c.name: getattr(sup, c.name) for c in sup.__table__.columns}
    old_risk = sup.risk_level
    sup = crud.supplier.update(db, sup, sup_in.model_dump(exclude_unset=True))

    if sup_in.risk_level and sup_in.risk_level != old_risk:
        risk_log = models.SupplierRiskLog(
            supplier_id=supplier_id, previous_level=old_risk,
            new_level=sup_in.risk_level, reason=sup_in.remarks or "风险等级调整",
            triggered_by=current_user.id
        )
        db.add(risk_log)
        db.commit()
        if sup_in.risk_level in [models.SupplierRiskLevel.HIGH, models.SupplierRiskLevel.CRITICAL]:
            admins = db.query(models.User).filter(
                models.User.role.in_([models.UserRole.MANAGER, models.UserRole.ADMIN])
            ).all()
            for admin in admins:
                create_notification(db, admin.id, models.AlertType.SUPPLIER_RISK,
                                    f"供应商风险提醒: {sup.name}",
                                    f"风险等级由 {old_risk.value} 调整为 {sup_in.risk_level.value}",
                                    "supplier", supplier_id)

    create_audit_log(db, "update", "supplier", sup.id, sup.name, current_user,
                     old_value=old_data, new_value=sup_in.model_dump(exclude_unset=True),
                     description="更新供应商信息")
    return ResponseModel(data=sup)


@router.get("/{supplier_id}/risk-logs", response_model=ResponseModel[PageResult[schemas.SupplierRiskLogInDB]])
def get_supplier_risk_logs(
    supplier_id: int, page: int = 1, page_size: int = 20,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    items, total = crud.supplier_risk_log.get_multi(
        db, page=page, page_size=page_size, filters={"supplier_id": supplier_id}, order_by="created_at"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))
