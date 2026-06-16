import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.writeoff import (
    WriteoffCreate,
    WriteoffListResponse,
    WriteoffResponse,
    WriteoffUpdate,
)
from app.services.writeoff_service import WriteoffService

router = APIRouter(prefix="/writeoffs", tags=["Writeoffs"])


class WriteoffApproveRequest(BaseModel):
    approver: str


@router.get("/", response_model=WriteoffListResponse)
async def list_writeoffs(
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    operator: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = WriteoffService(db)
    return await service.list_writeoffs(
        status=status,
        date_from=date_from,
        date_to=date_to,
        operator=operator,
        page=page,
        page_size=page_size,
    )


@router.get("/{writeoff_id}", response_model=WriteoffResponse)
async def get_writeoff(writeoff_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = WriteoffService(db)
    writeoff = await service.get_writeoff(writeoff_id)
    if not writeoff:
        raise HTTPException(status_code=404, detail="Writeoff not found")
    return writeoff


@router.post("/", response_model=WriteoffResponse, status_code=201)
async def create_writeoff(data: WriteoffCreate, db: AsyncSession = Depends(get_db)):
    service = WriteoffService(db)
    return await service.create_writeoff(data)


@router.put("/{writeoff_id}", response_model=WriteoffResponse)
async def update_writeoff(writeoff_id: uuid.UUID, data: WriteoffUpdate, db: AsyncSession = Depends(get_db)):
    service = WriteoffService(db)
    writeoff = await service.update_writeoff(writeoff_id, data)
    if not writeoff:
        raise HTTPException(status_code=404, detail="Writeoff not found")
    return writeoff


@router.post("/{writeoff_id}/approve", response_model=WriteoffResponse)
async def approve_writeoff(writeoff_id: uuid.UUID, data: WriteoffApproveRequest, db: AsyncSession = Depends(get_db)):
    service = WriteoffService(db)
    writeoff = await service.approve_writeoff(writeoff_id, data.approver)
    if not writeoff:
        raise HTTPException(status_code=404, detail="Writeoff not found")
    return writeoff
