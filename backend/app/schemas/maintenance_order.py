from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import MaintenanceOrderStatus, MaintenanceType, MaintenancePriority


class MaintenanceOrderBase(BaseModel):
    property_id: int
    maintenance_type: MaintenanceType
    priority: Optional[MaintenancePriority] = MaintenancePriority.NORMAL
    scheduled_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None
    estimated_cost: Optional[float] = 0.0
    title: str
    description: Optional[str] = None


class MaintenanceOrderCreate(MaintenanceOrderBase):
    pass


class MaintenanceOrderUpdate(BaseModel):
    maintenance_type: Optional[MaintenanceType] = None
    priority: Optional[MaintenancePriority] = None
    scheduled_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    title: Optional[str] = None
    description: Optional[str] = None


class MaintenanceOrderAssign(BaseModel):
    technician_id: int
    scheduled_time: Optional[datetime] = None


class MaintenanceOrderSubmit(BaseModel):
    solution: Optional[str] = None
    actual_cost: Optional[float] = None


class MaintenanceOrderReview(BaseModel):
    remarks: Optional[str] = None


class MaintenanceOrderResponse(BaseModel):
    id: int
    order_no: str
    property_id: int
    technician_id: Optional[int] = None
    created_by: int
    status: MaintenanceOrderStatus
    maintenance_type: MaintenanceType
    priority: MaintenancePriority
    scheduled_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    title: str
    description: Optional[str] = None
    solution: Optional[str] = None
    inspector_remarks: Optional[str] = None
    is_overdue: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaintenanceOrderQuery(BaseModel):
    status: Optional[MaintenanceOrderStatus] = None
    property_id: Optional[int] = None
    technician_id: Optional[int] = None
    maintenance_type: Optional[MaintenanceType] = None
    priority: Optional[MaintenancePriority] = None
    is_overdue: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    community: Optional[str] = None
