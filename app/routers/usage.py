from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.usage import ApiUsageCreate, ApiUsageResponse
from app.services.usage import ApiUsageService

router = APIRouter(prefix="/usage")


@router.get("/")
async def usage_trends_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("usage/index.html", {"request": request})


@router.get("/api/trend/{tenant_id}")
async def usage_trend(tenant_id: str, days: int = 7, db: AsyncSession = Depends(get_db)):
    svc = ApiUsageService(db)
    trend = await svc.get_trend(tenant_id)
    if days and len(trend) > days:
        trend = trend[-days:]
    return {"tenant_id": tenant_id, "days": days, "trend": trend}


@router.get("/api/list/{tenant_id}", response_model=list[ApiUsageResponse])
async def list_usage(
    tenant_id: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    svc = ApiUsageService(db)
    records = await svc.list_by_tenant(tenant_id, start_date=start_date, end_date=end_date, offset=offset, limit=size)
    return records


@router.post("/api/bulk", response_model=list[ApiUsageResponse], status_code=201)
async def create_bulk_usage(records: list[ApiUsageCreate], db: AsyncSession = Depends(get_db)):
    svc = ApiUsageService(db)
    items = await svc.create_bulk([r.model_dump() for r in records])
    await db.commit()
    return items
