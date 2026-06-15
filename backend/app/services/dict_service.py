from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dict import DictCategory, DictItem


class DictService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_categories(self):
        result = await self.db.execute(select(DictCategory).order_by(DictCategory.id))
        categories = result.scalars().all()
        return [
            {"id": c.id, "code": c.code, "name": c.name, "description": c.description}
            for c in categories
        ]

    async def create_category(self, data):
        existing = await self.db.execute(
            select(DictCategory).where(DictCategory.code == data.code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category code already exists")
        cat = DictCategory(code=data.code, name=data.name, description=data.description)
        self.db.add(cat)
        await self.db.commit()
        await self.db.refresh(cat)
        return {"id": cat.id, "code": cat.code, "name": cat.name, "description": cat.description}

    async def update_category(self, category_id: int, data):
        result = await self.db.execute(
            select(DictCategory).where(DictCategory.id == category_id)
        )
        cat = result.scalar_one_or_none()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        if data.code is not None:
            cat.code = data.code
        if data.name is not None:
            cat.name = data.name
        if data.description is not None:
            cat.description = data.description
        await self.db.commit()
        await self.db.refresh(cat)
        return {"id": cat.id, "code": cat.code, "name": cat.name, "description": cat.description}

    async def delete_category(self, category_id: int):
        result = await self.db.execute(
            select(DictCategory).where(DictCategory.id == category_id)
        )
        cat = result.scalar_one_or_none()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        await self.db.delete(cat)
        await self.db.commit()

    async def list_items(self, category_id: int | None = None):
        query = select(DictItem).order_by(DictItem.sort_order, DictItem.id)
        if category_id is not None:
            query = query.where(DictItem.category_id == category_id)
        result = await self.db.execute(query)
        items = result.scalars().all()
        return [
            {
                "id": i.id,
                "category_id": i.category_id,
                "code": i.code,
                "label": i.label,
                "value": i.value,
                "sort_order": i.sort_order,
                "is_active": i.is_active,
            }
            for i in items
        ]

    async def create_item(self, data):
        item = DictItem(
            category_id=data.category_id,
            code=data.code,
            label=data.label,
            value=data.value,
            sort_order=data.sort_order,
            is_active=data.is_active,
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "category_id": item.category_id,
            "code": item.code,
            "label": item.label,
            "value": item.value,
            "sort_order": item.sort_order,
            "is_active": item.is_active,
        }

    async def update_item(self, item_id: int, data):
        result = await self.db.execute(select(DictItem).where(DictItem.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if data.code is not None:
            item.code = data.code
        if data.label is not None:
            item.label = data.label
        if data.value is not None:
            item.value = data.value
        if data.sort_order is not None:
            item.sort_order = data.sort_order
        if data.is_active is not None:
            item.is_active = data.is_active
        await self.db.commit()
        await self.db.refresh(item)
        return {
            "id": item.id,
            "category_id": item.category_id,
            "code": item.code,
            "label": item.label,
            "value": item.value,
            "sort_order": item.sort_order,
            "is_active": item.is_active,
        }

    async def delete_item(self, item_id: int):
        result = await self.db.execute(select(DictItem).where(DictItem.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        await self.db.delete(item)
        await self.db.commit()
