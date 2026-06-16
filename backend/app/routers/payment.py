import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.payment import (
    PaymentCreate,
    PaymentListResponse,
    PaymentResponse,
    PaymentUpdate,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=PaymentListResponse)
async def list_payments(
    ar_record_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    operator: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = PaymentService(db)
    return await service.list_payments(
        ar_record_id=ar_record_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        operator=operator,
        page=page,
        page_size=page_size,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = PaymentService(db)
    payment = await service.get_payment(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=PaymentResponse, status_code=201)
async def create_payment(data: PaymentCreate, db: AsyncSession = Depends(get_db)):
    service = PaymentService(db)
    return await service.create_payment(data)


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: uuid.UUID, data: PaymentUpdate, db: AsyncSession = Depends(get_db)):
    service = PaymentService(db)
    payment = await service.update_payment(payment_id, data)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
