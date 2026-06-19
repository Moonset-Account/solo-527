from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/dictionaries", tags=["字典管理"])


@router.get("", response_model=dict)
async def list_dictionaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    dict_type: Optional[str] = None,
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Dictionary)
    if dict_type:
        query = query.filter(models.Dictionary.dict_type == dict_type)
    if keyword:
        query = query.filter(
            or_(
                models.Dictionary.dict_value.like(f"%{keyword}%"),
                models.Dictionary.dict_code.like(f"%{keyword}%")
            )
        )
    if is_active is not None:
        query = query.filter(models.Dictionary.is_active == is_active)
    total = query.count()
    items = query.order_by(models.Dictionary.dict_type, models.Dictionary.sort_order).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.DictionaryResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/types", response_model=list)
async def list_dict_types(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    types = db.query(models.Dictionary.dict_type).distinct().all()
    return [t[0] for t in types]


@router.post("", response_model=schemas.DictionaryResponse)
async def create_dictionary(
    data: schemas.DictionaryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    existing = db.query(models.Dictionary).filter(
        models.Dictionary.dict_type == data.dict_type,
        models.Dictionary.dict_code == data.dict_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="同类型字典编码已存在")
    item = models.Dictionary(**data.model_dump(), created_by=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{dict_id}", response_model=schemas.DictionaryResponse)
async def update_dictionary(
    dict_id: int,
    data: schemas.DictionaryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    item = db.query(models.Dictionary).filter(models.Dictionary.id == dict_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="字典项不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{dict_id}")
async def delete_dictionary(
    dict_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    item = db.query(models.Dictionary).filter(models.Dictionary.id == dict_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="字典项不存在")
    db.delete(item)
    db.commit()
    return {"message": "已删除"}
