from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.dict_service import DictService

router = APIRouter(prefix="/dict", tags=["dict"])


class CategoryCreate(BaseModel):
    code: str
    name: str
    description: str | None = None


class CategoryUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None


class ItemCreate(BaseModel):
    category_id: int
    code: str
    label: str
    value: str | None = None
    sort_order: int = 0
    is_active: bool = True


class ItemUpdate(BaseModel):
    code: str | None = None
    label: str | None = None
    value: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    return await svc.list_categories()


@router.post("/categories")
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    return await svc.create_category(data)


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db)
):
    svc = DictService(db)
    return await svc.update_category(category_id, data)


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    await svc.delete_category(category_id)
    return {"ok": True}


@router.get("/items")
async def list_items(
    category_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    svc = DictService(db)
    return await svc.list_items(category_id)


@router.post("/items")
async def create_item(data: ItemCreate, db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    return await svc.create_item(data)


@router.put("/items/{item_id}")
async def update_item(item_id: int, data: ItemUpdate, db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    return await svc.update_item(item_id, data)


@router.delete("/items/{item_id}")
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    svc = DictService(db)
    await svc.delete_item(item_id)
    return {"ok": True}
