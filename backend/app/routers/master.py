from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/master", tags=["基础数据"])


@router.get("/stores", response_model=List[schemas.Store])
def read_stores(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if active_only:
        return crud.crud_store.get_all_active(db, skip=skip, limit=limit)
    return crud.crud_store.get_multi(db, skip=skip, limit=limit)


@router.get("/stores/{store_id}", response_model=schemas.Store)
def read_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    store = crud.crud_store.get(db, id=store_id)
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    return store


@router.post("/stores", response_model=schemas.Store)
def create_store(
    store_in: schemas.StoreCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    existing = crud.crud_store.get_by_name(db, name=store_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="门店名称已存在")
    return crud.crud_store.create(db, obj_in=store_in)


@router.put("/stores/{store_id}", response_model=schemas.Store)
def update_store(
    store_id: int,
    store_in: schemas.StoreUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    store = crud.crud_store.get(db, id=store_id)
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    return crud.crud_store.update(db, db_obj=store, obj_in=store_in)


@router.get("/products", response_model=List[schemas.Product])
def read_products(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if category:
        return crud.crud_product.get_by_category(db, category=category, skip=skip, limit=limit)
    return crud.crud_product.get_multi(db, skip=skip, limit=limit, filters={"is_active": True})


@router.get("/products/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    product = crud.crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")
    return product


@router.post("/products", response_model=schemas.Product)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    if product_in.sku:
        existing = crud.crud_product.get_by_sku(db, sku=product_in.sku)
        if existing:
            raise HTTPException(status_code=400, detail="SKU已存在")
    return crud.crud_product.create(db, obj_in=product_in)


@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    product = crud.crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")
    return crud.crud_product.update(db, db_obj=product, obj_in=product_in)


@router.get("/ingredients", response_model=List[schemas.Ingredient])
def read_ingredients(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if category:
        return crud.crud_ingredient.get_by_category(db, category=category, skip=skip, limit=limit)
    return crud.crud_ingredient.get_multi(db, skip=skip, limit=limit, filters={"is_active": True})


@router.get("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def read_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    ingredient = crud.crud_ingredient.get(db, id=ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="食材不存在")
    return ingredient


@router.post("/ingredients", response_model=schemas.Ingredient)
def create_ingredient(
    ingredient_in: schemas.IngredientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    if ingredient_in.sku:
        existing = crud.crud_ingredient.get_by_sku(db, sku=ingredient_in.sku)
        if existing:
            raise HTTPException(status_code=400, detail="SKU已存在")
    return crud.crud_ingredient.create(db, obj_in=ingredient_in)


@router.put("/ingredients/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(
    ingredient_id: int,
    ingredient_in: schemas.IngredientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    ingredient = crud.crud_ingredient.get(db, id=ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="食材不存在")
    return crud.crud_ingredient.update(db, db_obj=ingredient, obj_in=ingredient_in)


@router.get("/users", response_model=List[schemas.User])
def read_users(
    store_id: Optional[int] = None,
    role: Optional[models.UserRole] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    filters = {}
    if store_id:
        filters["store_id"] = store_id
    if role:
        filters["role"] = role
    return crud.crud_user.get_multi(db, skip=skip, limit=limit, filters=filters)


@router.post("/users", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    existing = crud.crud_user.get_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    if user_in.email:
        existing_email = crud.crud_user.get_by_email(db, email=user_in.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="邮箱已存在")
    return crud.crud_user.create(db, obj_in=user_in)


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    user = crud.crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return crud.crud_user.update(db, db_obj=user, obj_in=user_in)
