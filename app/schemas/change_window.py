from pydantic import BaseModel
from app.models.change_window import WindowStatusEnum
from datetime import datetime


class ChangeWindowCreate(BaseModel):
    title: str
    description: str | None = None
    status: WindowStatusEnum = WindowStatusEnum.planned
    start_time: datetime
    end_time: datetime
    is_risky: bool = False
    responsible_person: str | None = None


class ChangeWindowUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: WindowStatusEnum | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_risky: bool | None = None
    responsible_person: str | None = None


class ChangeWindowRead(BaseModel):
    id: int
    title: str
    description: str | None
    status: WindowStatusEnum
    start_time: datetime
    end_time: datetime
    is_risky: bool
    responsible_person: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
