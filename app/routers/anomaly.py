from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.anomaly import AnomalyCreate, AnomalyUpdate, AnomalyResponse
from app.services.anomaly import AnomalyService

router = APIRouter(prefix="/anomalies")


@router.get("/")
async def anomaly_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("anomalies/index.html", {"request": request})


@router.get("/api/", response_model=list[AnomalyResponse])
async def list_anomalies(
    tenant_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    svc = AnomalyService(db)
    anomalies = await svc.list(tenant_id=tenant_id, status=status, offset=offset, limit=size)
    return anomalies


@router.post("/api/", response_model=AnomalyResponse, status_code=201)
async def create_anomaly(data: AnomalyCreate, db: AsyncSession = Depends(get_db)):
    svc = AnomalyService(db)
    anomaly = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(anomaly)
    return anomaly


@router.put("/api/{anomaly_id}", response_model=AnomalyResponse)
async def update_anomaly(anomaly_id: str, data: AnomalyUpdate, db: AsyncSession = Depends(get_db)):
    svc = AnomalyService(db)
    anomaly = await svc.update_status(anomaly_id, status=data.status or "open", **data.model_dump(exclude_unset=True, exclude={"status"}))
    await db.commit()
    return anomaly


@router.post("/api/{anomaly_id}/resolve", response_model=AnomalyResponse)
async def resolve_anomaly(anomaly_id: str, db: AsyncSession = Depends(get_db)):
    svc = AnomalyService(db)
    anomaly = await svc.resolve(anomaly_id)
    await db.commit()
    return anomaly
