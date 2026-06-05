import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DeliverySignRequest(BaseModel):
    exception_note: Optional[str] = None


class DeliveryFailRequest(BaseModel):
    exception_note: str


class DeliveryOut(BaseModel):
    id: uuid.UUID
    route_id: uuid.UUID
    elder_id: uuid.UUID
    order_id: Optional[uuid.UUID] = None
    courier_id: Optional[uuid.UUID] = None
    status: str
    signed_photo_url: Optional[str] = None
    signed_at: Optional[datetime] = None
    exception_note: Optional[str] = None
    needs_redispatch: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryCourierView(BaseModel):
    id: uuid.UUID
    route_id: uuid.UUID
    elder_id: uuid.UUID
    status: str
    exception_note: Optional[str] = None
    elder_name: Optional[str] = None
    elder_building: Optional[str] = None
    elder_room: Optional[str] = None
    elder_phone_masked: Optional[str] = None

    class Config:
        from_attributes = True
