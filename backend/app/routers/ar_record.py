import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.ar_record import (
    ARRecordCreate,
    ARRecordListResponse,
    ARRecordResponse,
    ARRecordSummary,
    ARRecordUpdate,
)
from app.services.ar_service import ARService

router = APIRouter(prefix="/ar-records", tags=["AR Records"])


@router.get("/", response_model=ARRecordListResponse)
async def list_ar_records(
    customer_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    responsible_person: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ARService(db)
    return await service.list_records(
        customer_name=customer_name,
        status=status,
        responsible_person=responsible_person,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=list[ARRecordSummary])
async def get_ar_summary(db: AsyncSession = Depends(get_db)):
    service = ARService(db)
    return await service.get_summary()


@router.get("/{record_id}", response_model=ARRecordResponse)
async def get_ar_record(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ARService(db)
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="AR record not found")
    return record


@router.post("/", response_model=ARRecordResponse, status_code=201)
async def create_ar_record(data: ARRecordCreate, db: AsyncSession = Depends(get_db)):
    service = ARService(db)
    return await service.create_record(data)


@router.put("/{record_id}", response_model=ARRecordResponse)
async def update_ar_record(record_id: uuid.UUID, data: ARRecordUpdate, db: AsyncSession = Depends(get_db)):
    service = ARService(db)
    record = await service.update_record(record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="AR record not found")
    return record


@router.get("/{record_id}/drilldown", response_model=list[ARRecordResponse])
async def drilldown_ar_record(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ARService(db)
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="AR record not found")
    return await service.drilldown(record.customer_name)
