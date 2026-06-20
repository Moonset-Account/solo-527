from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bill, InvoiceHeader


class BillService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_tenant(self, tenant_id: str, offset: int = 0, limit: int = 20) -> list[Bill]:
        stmt = select(Bill).where(Bill.tenant_id == tenant_id).order_by(Bill.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Bill:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        bill = Bill(**kwargs)
        self.session.add(bill)
        await self.session.flush()
        return bill

    async def update_status(self, bill_id: str, status: str) -> Bill | None:
        stmt = select(Bill).where(Bill.id == bill_id)
        result = await self.session.execute(stmt)
        bill = result.scalar_one_or_none()
        if not bill:
            return None
        bill.status = status
        bill.updated_at = datetime.utcnow()
        await self.session.flush()
        return bill


class InvoiceHeaderService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_tenant(self, tenant_id: str) -> list[InvoiceHeader]:
        stmt = select(InvoiceHeader).where(InvoiceHeader.tenant_id == tenant_id).order_by(InvoiceHeader.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> InvoiceHeader:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        invoice = InvoiceHeader(**kwargs)
        self.session.add(invoice)
        await self.session.flush()
        if kwargs.get("is_default"):
            await self._clear_other_defaults(invoice.tenant_id, invoice.id)
        return invoice

    async def update(self, invoice_id: str, **kwargs) -> InvoiceHeader | None:
        stmt = select(InvoiceHeader).where(InvoiceHeader.id == invoice_id)
        result = await self.session.execute(stmt)
        invoice = result.scalar_one_or_none()
        if not invoice:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(invoice, key, value)
        await self.session.flush()
        if kwargs.get("is_default"):
            await self._clear_other_defaults(invoice.tenant_id, invoice.id)
        return invoice

    async def set_default(self, invoice_id: str) -> InvoiceHeader | None:
        stmt = select(InvoiceHeader).where(InvoiceHeader.id == invoice_id)
        result = await self.session.execute(stmt)
        invoice = result.scalar_one_or_none()
        if not invoice:
            return None
        await self._clear_other_defaults(invoice.tenant_id, invoice.id)
        invoice.is_default = True
        invoice.updated_at = datetime.utcnow()
        await self.session.flush()
        return invoice

    async def toggle_active(self, invoice_id: str) -> InvoiceHeader | None:
        stmt = select(InvoiceHeader).where(InvoiceHeader.id == invoice_id)
        result = await self.session.execute(stmt)
        invoice = result.scalar_one_or_none()
        if not invoice:
            return None
        invoice.is_active = not invoice.is_active
        invoice.updated_at = datetime.utcnow()
        await self.session.flush()
        return invoice

    async def _clear_other_defaults(self, tenant_id: str, keep_id: str):
        stmt = (
            update(InvoiceHeader)
            .where(InvoiceHeader.tenant_id == tenant_id, InvoiceHeader.id != keep_id, InvoiceHeader.is_default == True)
            .values(is_default=False, updated_at=datetime.utcnow())
        )
        await self.session.execute(stmt)
