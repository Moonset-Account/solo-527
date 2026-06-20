from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.arrears import ArrearCreate, ArrearUpdate, ArrearResponse, HealthStatResponse
from app.services.arrears import ArrearService, HealthStatService

router = APIRouter(prefix="/arrears")


@router.get("/")
async def arrears_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("arrears/index.html", {"request": request})


@router.get("/api/", response_model=list[ArrearResponse])
async def list_arrears(status: str | None = None, page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * size
    svc = ArrearService(db)
    arrears = await svc.list(status=status, offset=offset, limit=size)
    return arrears


@router.post("/api/", response_model=ArrearResponse, status_code=201)
async def create_arrear(data: ArrearCreate, db: AsyncSession = Depends(get_db)):
    svc = ArrearService(db)
    arrear = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(arrear)
    return arrear


@router.put("/api/{arrear_id}", response_model=ArrearResponse)
async def update_arrear(arrear_id: str, data: ArrearUpdate, db: AsyncSession = Depends(get_db)):
    svc = ArrearService(db)
    arrear = await svc.update(arrear_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return arrear


@router.get("/api/health/{tenant_id}", response_model=list[HealthStatResponse])
async def health_stats(tenant_id: str, db: AsyncSession = Depends(get_db)):
    svc = HealthStatService(db)
    stats = await svc.list_by_tenant(tenant_id)
    return stats


@router.get("/api/health-summary")
async def health_summary(db: AsyncSession = Depends(get_db)):
    svc = ArrearService(db)
    summary = await svc.get_health_stats_summary()
    return summary
