from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..utils import create_audit_log
from ..schemas.common import ResponseModel, PageResult, PageParams

router = APIRouter(prefix="/api/materials", tags=["耗材管理"])


@router.get("/categories", response_model=ResponseModel[PageResult[schemas.MaterialCategoryInDB]])
def list_categories(
    page: int = 1, page_size: int = 50, keyword: Optional[str] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    items, total = crud.material_category.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["name", "code"], order_by="id"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("/categories", response_model=ResponseModel[schemas.MaterialCategoryInDB])
def create_category(
    cat_in: schemas.MaterialCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    cat = crud.material_category.create(db, obj_in=cat_in.model_dump())
    create_audit_log(db, "create", "material_category", cat.id, cat.name, current_user,
                     new_value=cat_in.model_dump(), description="创建耗材分类")
    return ResponseModel(data=cat)


@router.get("", response_model=ResponseModel[PageResult[schemas.MaterialInDB]])
def list_materials(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    category_id: Optional[int] = None, is_active: Optional[bool] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if category_id: filters["category_id"] = category_id
    if is_active is not None: filters["is_active"] = is_active
    items, total = crud.material.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["name", "code", "specification", "brand", "model"],
        filters=filters, order_by="id"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("", response_model=ResponseModel[schemas.MaterialInDB])
def create_material(
    mat_in: schemas.MaterialCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    mat_data = mat_in.model_dump()
    mat_data["created_by"] = current_user.id
    mat = crud.material.create(db, obj_in=mat_data)
    create_audit_log(db, "create", "material", mat.id, mat.name, current_user,
                     new_value=mat_in.model_dump(), description="创建耗材规格")
    return ResponseModel(data=mat)


@router.get("/{material_id}", response_model=ResponseModel[schemas.MaterialInDB])
def get_material(material_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    mat = crud.material.get(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="耗材不存在")
    return ResponseModel(data=mat)


@router.put("/{material_id}", response_model=ResponseModel[schemas.MaterialInDB])
def update_material(
    material_id: int, mat_in: schemas.MaterialUpdate,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    mat = crud.material.get(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="耗材不存在")
    old_data = {c.name: getattr(mat, c.name) for c in mat.__table__.columns}
    mat = crud.material.update(db, mat, mat_in.model_dump(exclude_unset=True))
    create_audit_log(db, "update", "material", mat.id, mat.name, current_user,
                     old_value=old_data, new_value=mat_in.model_dump(exclude_unset=True),
                     description="更新耗材信息")
    return ResponseModel(data=mat)


@router.get("/monthly-usages", response_model=ResponseModel[PageResult[schemas.MonthlyUsageInDB]])
def list_monthly_usages(
    page: int = 1, page_size: int = 20, material_id: Optional[int] = None,
    year: Optional[int] = None, month: Optional[int] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if material_id: filters["material_id"] = material_id
    if year: filters["year"] = year
    if month: filters["month"] = month
    items, total = crud.monthly_usage.get_multi(
        db, page=page, page_size=page_size, filters=filters, order_by="id"
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("/monthly-usages", response_model=ResponseModel[schemas.MonthlyUsageInDB])
def create_monthly_usage(
    usage_in: schemas.MonthlyUsageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    usage_data = usage_in.model_dump()
    usage_data["recorded_by"] = current_user.id
    usage = crud.monthly_usage.create(db, obj_in=usage_data)
    create_audit_log(db, "create", "monthly_usage", usage.id, str(usage.material_id), current_user,
                     new_value=usage_in.model_dump(), description="登记月度用量")
    return ResponseModel(data=usage)


@router.put("/monthly-usages/{usage_id}", response_model=ResponseModel[schemas.MonthlyUsageInDB])
def update_monthly_usage(
    usage_id: int, usage_in: schemas.MonthlyUsageUpdate,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    usage = crud.monthly_usage.get(db, usage_id)
    if not usage:
        raise HTTPException(status_code=404, detail="记录不存在")
    usage = crud.monthly_usage.update(db, usage, usage_in.model_dump(exclude_unset=True))
    return ResponseModel(data=usage)
