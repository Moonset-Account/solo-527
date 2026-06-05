from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import User, Category
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["品类管理"])


@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(Category).filter(Category.is_active == 1).offset(skip).limit(limit).all()


@router.post("/", response_model=CategoryResponse, dependencies=[Depends(PermissionRequired("manage_booths"))])
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Category).filter(
        (Category.name == category_in.name) | (Category.code == category_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="品类名称或编码已存在")
    category = Category(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
