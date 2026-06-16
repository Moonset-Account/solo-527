from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..utils import create_audit_log, create_notification
from ..schemas.common import ResponseModel, PageResult

router = APIRouter(prefix="/api/agreements", tags=["框架协议"])


def generate_agreement_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    last = db.query(models.FrameworkAgreement).filter(
        models.FrameworkAgreement.agreement_no.like(f"FA{today}%")
    ).order_by(models.FrameworkAgreement.agreement_no.desc()).first()
    seq = int(last.agreement_no[-4:]) + 1 if last else 1
    return f"FA{today}{seq:04d}"


@router.get("", response_model=ResponseModel[PageResult[schemas.FrameworkAgreementInDB]])
def list_agreements(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    status: Optional[models.AgreementStatus] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if status: filters["status"] = status
    if supplier_id: filters["supplier_id"] = supplier_id
    items, total = crud.framework_agreement.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["agreement_no", "title"], filters=filters, order_by="id",
        includes=["items", "supplier"]
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("", response_model=ResponseModel[schemas.FrameworkAgreementInDB])
def create_agreement(
    agree_in: schemas.FrameworkAgreementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    agree_data = agree_in.model_dump(exclude={"items"})
    agree_data["agreement_no"] = generate_agreement_no(db)
    agree_data["created_by"] = current_user.id
    agree_data["remaining_amount"] = agree_data.get("total_estimated_amount", 0)
    agree = crud.framework_agreement.create(db, obj_in=agree_data)

    for item_in in agree_in.items:
        item_data = item_in.model_dump()
        item_data["agreement_id"] = agree.id
        crud.agreement_item.create(db, obj_in=item_data)

    db.refresh(agree)
    create_audit_log(db, "create", "framework_agreement", agree.id, agree.agreement_no, current_user,
                     new_value=agree_in.model_dump(), description="创建框架协议")
    return ResponseModel(data=agree)


@router.get("/{agreement_id}", response_model=ResponseModel[schemas.FrameworkAgreementInDB])
def get_agreement(agreement_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    agree = crud.framework_agreement.get(db, agreement_id, includes=["items", "supplier"])
    if not agree:
        raise HTTPException(status_code=404, detail="框架协议不存在")
    return ResponseModel(data=agree)


@router.put("/{agreement_id}", response_model=ResponseModel[schemas.FrameworkAgreementInDB])
def update_agreement(
    agreement_id: int, agree_in: schemas.FrameworkAgreementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    agree = crud.framework_agreement.get(db, agreement_id)
    if not agree:
        raise HTTPException(status_code=404, detail="框架协议不存在")
    update_data = agree_in.model_dump(exclude_unset=True)
    if agree_in.status == models.AgreementStatus.ACTIVE and agree.status != models.AgreementStatus.ACTIVE:
        update_data["approved_by"] = current_user.id
        update_data["approved_at"] = datetime.utcnow()
    agree = crud.framework_agreement.update(db, agree, update_data)
    create_audit_log(db, "update", "framework_agreement", agree.id, agree.agreement_no, current_user,
                     new_value=agree_in.model_dump(exclude_unset=True), description="更新框架协议")
    return ResponseModel(data=agree)
