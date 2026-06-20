from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.billing import BillCreate, BillUpdate, BillResponse, InvoiceHeaderCreate, InvoiceHeaderUpdate, InvoiceHeaderResponse
from app.services.billing import BillService, InvoiceHeaderService

router = APIRouter(prefix="/billing")


@router.get("/")
async def billing_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("billing/index.html", {"request": request})


@router.get("/api/bills", response_model=list[BillResponse])
async def list_bills(tenant_id: str | None = None, page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    svc = BillService(db)
    if tenant_id:
        offset = (page - 1) * size
        bills = await svc.list_by_tenant(tenant_id, offset=offset, limit=size)
    else:
        bills = []
    return bills


@router.post("/api/bills", response_model=BillResponse, status_code=201)
async def create_bill(data: BillCreate, db: AsyncSession = Depends(get_db)):
    svc = BillService(db)
    bill = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(bill)
    return bill


@router.put("/api/bills/{bill_id}", response_model=BillResponse)
async def update_bill(bill_id: str, data: BillUpdate, db: AsyncSession = Depends(get_db)):
    svc = BillService(db)
    bill = await svc.update_status(bill_id, status=data.status or "pending")
    await db.commit()
    return bill


@router.get("/api/invoices/{tenant_id}", response_model=list[InvoiceHeaderResponse])
async def list_invoices(tenant_id: str, db: AsyncSession = Depends(get_db)):
    svc = InvoiceHeaderService(db)
    invoices = await svc.list_by_tenant(tenant_id)
    return invoices


@router.post("/api/invoices", response_model=InvoiceHeaderResponse, status_code=201)
async def create_invoice(data: InvoiceHeaderCreate, db: AsyncSession = Depends(get_db)):
    svc = InvoiceHeaderService(db)
    invoice = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.put("/api/invoices/{invoice_id}", response_model=InvoiceHeaderResponse)
async def update_invoice(invoice_id: str, data: InvoiceHeaderUpdate, db: AsyncSession = Depends(get_db)):
    svc = InvoiceHeaderService(db)
    invoice = await svc.update(invoice_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return invoice


@router.post("/api/invoices/{invoice_id}/default", response_model=InvoiceHeaderResponse)
async def set_default_invoice(invoice_id: str, db: AsyncSession = Depends(get_db)):
    svc = InvoiceHeaderService(db)
    invoice = await svc.set_default(invoice_id)
    await db.commit()
    return invoice


@router.post("/api/invoices/{invoice_id}/toggle", response_model=InvoiceHeaderResponse)
async def toggle_invoice(invoice_id: str, db: AsyncSession = Depends(get_db)):
    svc = InvoiceHeaderService(db)
    invoice = await svc.toggle_active(invoice_id)
    await db.commit()
    return invoice
