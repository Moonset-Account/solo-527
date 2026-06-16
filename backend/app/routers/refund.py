import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.refund import (
    RefundCreate,
    RefundListResponse,
    RefundResponse,
    RefundUpdate,
)
from app.services.refund_service import RefundService

router = APIRouter(prefix="/refunds", tags=["Refunds"])


class RefundReviewRequest(BaseModel):
    reviewer: str
    status: str
    review_note: Optional[str] = None


@router.get("/", response_model=RefundListResponse)
async def list_refunds(
    ar_record_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    applicant: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = RefundService(db)
    return await service.list_refunds(
        ar_record_id=ar_record_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        applicant=applicant,
        page=page,
        page_size=page_size,
    )


@router.get("/{refund_id}", response_model=RefundResponse)
async def get_refund(refund_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = RefundService(db)
    refund = await service.get_refund(refund_id)
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    return refund


@router.post("/", response_model=RefundResponse, status_code=201)
async def create_refund(data: RefundCreate, db: AsyncSession = Depends(get_db)):
    service = RefundService(db)
    return await service.create_refund(data)


@router.put("/{refund_id}", response_model=RefundResponse)
async def update_refund(refund_id: uuid.UUID, data: RefundUpdate, db: AsyncSession = Depends(get_db)):
    service = RefundService(db)
    refund = await service.update_refund(refund_id, data)
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    return refund


@router.post("/{refund_id}/review", response_model=RefundResponse)
async def review_refund(refund_id: uuid.UUID, data: RefundReviewRequest, db: AsyncSession = Depends(get_db)):
    service = RefundService(db)
    refund = await service.review_refund(
        refund_id=refund_id,
        reviewer=data.reviewer,
        status=data.status,
        review_note=data.review_note,
    )
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    return refund
