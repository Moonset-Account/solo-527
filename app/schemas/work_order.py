from pydantic import BaseModel, field_validator
from app.models.work_order import OrderTypeEnum, OrderStatusEnum, PriorityEnum
from datetime import datetime


class WorkOrderCreate(BaseModel):
    title: str
    order_type: OrderTypeEnum
    description: str
    priority: PriorityEnum = PriorityEnum.medium
    sla_hours: float = 24.0

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("工单标题不能为空")
        if len(v.strip()) < 2:
            raise ValueError("工单标题至少2个字符")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("工单描述不能为空")
        return v.strip()

    @field_validator("sla_hours")
    @classmethod
    def sla_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("SLA时效必须大于0")
        return v


class WorkOrderAssign(BaseModel):
    assignee_id: int
    priority: PriorityEnum


class WorkOrderStatusUpdate(BaseModel):
    status: OrderStatusEnum
    comment: str | None = None

    @field_validator("comment")
    @classmethod
    def comment_required_on_reject(cls, v: str | None) -> str | None:
        return v


class ProcessingRecordCreate(BaseModel):
    action: str
    comment: str | None = None


class ProcessingRecordRead(BaseModel):
    id: int
    work_order_id: int
    handler_id: int
    action: str
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkOrderRead(BaseModel):
    id: int
    title: str
    order_type: OrderTypeEnum
    status: OrderStatusEnum
    priority: PriorityEnum
    description: str
    creator_id: int
    assignee_id: int | None
    sla_hours: float
    is_overdue: bool
    remaining_hours: float
    created_at: datetime
    assigned_at: datetime | None
    resolved_at: datetime | None
    closed_at: datetime | None
    creator_name: str | None = None
    assignee_name: str | None = None

    class Config:
        from_attributes = True


class WorkOrderFilter(BaseModel):
    status: OrderStatusEnum | None = None
    order_type: OrderTypeEnum | None = None
    priority: PriorityEnum | None = None
    assignee_id: int | None = None
    creator_id: int | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
