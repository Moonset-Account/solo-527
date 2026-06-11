from pydantic import BaseModel, Field
from typing import Optional


class InvoiceStatusBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    sort_order: int = 0


class InvoiceStatusCreate(InvoiceStatusBase):
    pass


class InvoiceStatusUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class InvoiceStatusResponse(InvoiceStatusBase):
    id: int

    class Config:
        from_attributes = True
