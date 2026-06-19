from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/suppliers", tags=["供应商"])


@router.get("", response_model=dict)
async def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Supplier)
    if keyword:
        query = query.filter(
            or_(
                models.Supplier.name.like(f"%{keyword}%"),
                models.Supplier.code.like(f"%{keyword}%"),
                models.Supplier.contact_person.like(f"%{keyword}%")
            )
        )
    if is_active is not None:
        query = query.filter(models.Supplier.is_active == is_active)
    total = query.count()
    items = query.order_by(models.Supplier.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.SupplierResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.SupplierResponse)
async def create_supplier(
    data: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "manager"))
):
    existing = db.query(models.Supplier).filter(
        or_(models.Supplier.code == data.code, models.Supplier.name == data.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="供应商编码或名称已存在")
    supplier = models.Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=schemas.SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return supplier


@router.put("/{supplier_id}", response_model=schemas.SupplierResponse)
async def update_supplier(
    supplier_id: int,
    data: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(supplier, k, v)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    linked_meds = db.query(models.Medicine).filter(
        models.Medicine.supplier_id == supplier_id
    ).count()
    if linked_meds > 0:
        raise HTTPException(status_code=400, detail=f"该供应商关联了{linked_meds}个药品，无法删除")
    supplier.is_active = False
    db.commit()
    return {"message": "供应商已停用"}
