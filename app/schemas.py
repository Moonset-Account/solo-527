from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field

from app.models import OrderStatus, TechnicianStatus, RefundReason


class RegionBase(BaseModel):
    name: str
    city: Optional[str] = None
    description: Optional[str] = None


class RegionCreate(RegionBase):
    pass


class RegionOut(RegionBase):
    id: int
    demand_level: int = 0

    class Config:
        from_attributes = True


class CommunityBase(BaseModel):
    name: str
    region_id: int
    address_prefix: Optional[str] = None


class CommunityCreate(CommunityBase):
    pass


class CommunityOut(CommunityBase):
    id: int
    demand_count: int = 0

    class Config:
        from_attributes = True


class TechnicianBase(BaseModel):
    name: str
    phone: str
    skill_level: int = 1
    community_id: Optional[int] = None
    daily_max_orders: int = 8


class TechnicianCreate(TechnicianBase):
    pass


class TechnicianOut(TechnicianBase):
    id: int
    status: TechnicianStatus = TechnicianStatus.IDLE
    today_orders: int = 0
    total_completed: int = 0
    rating_avg: float = 5.0

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    rating: int = 5
    comment: Optional[str] = None
    revisit_note: Optional[str] = None


class ReviewCreate(ReviewBase):
    order_id: int
    technician_id: Optional[int] = None


class ReviewOut(ReviewBase):
    id: int
    order_id: int
    revisited: bool = False
    revisited_by: Optional[str] = None
    revisited_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RepairOrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    appliance_type: Optional[str] = None
    fault_description: Optional[str] = None
    address_detail: str
    region_id: Optional[int] = None
    community_id: Optional[int] = None
    schedule_date: Optional[date] = None
    schedule_time_slot: Optional[str] = None
    priority: int = 1


class RepairOrderCreate(RepairOrderBase):
    pass


class RepairOrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    technician_id: Optional[int] = None
    repair_fee: Optional[float] = None
    parts_fee: Optional[float] = None
    paid: Optional[bool] = None
    refund_reason: Optional[RefundReason] = None
    refund_note: Optional[str] = None
    refund_amount: Optional[float] = None
    schedule_date: Optional[date] = None
    schedule_time_slot: Optional[str] = None


class RepairOrderOut(RepairOrderBase):
    id: int
    order_no: str
    status: OrderStatus
    fault_photos: List[str] = []
    full_address: Optional[str] = None
    appointment_time: Optional[datetime] = None
    technician_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    repair_fee: float = 0
    parts_fee: float = 0
    total_fee: float = 0
    paid: bool = False
    refund_reason: Optional[RefundReason] = None
    refund_note: Optional[str] = None
    refund_amount: float = 0
    refunded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    technician: Optional[TechnicianOut] = None
    review: Optional[ReviewOut] = None

    class Config:
        from_attributes = True


class WorkRecordOut(BaseModel):
    id: int
    order_id: int
    technician_id: int
    work_date: date
    community_id: Optional[int] = None
    hours_spent: float
    status: Optional[str] = None

    class Config:
        from_attributes = True


class ActionLogOut(BaseModel):
    id: int
    order_id: Optional[int] = None
    action_type: str
    operator: str
    detail: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TechnicianLoadDetail(BaseModel):
    date_key: date
    community_id: Optional[int]
    community_name: Optional[str]
    order_count: int
    hours: float
    refund_issues: int
    refund_reasons: List[str] = []


class TechnicianLoadOut(BaseModel):
    technician_id: int
    technician_name: str
    total_orders: int
    total_hours: float
    avg_rating: float
    by_date: List[TechnicianLoadDetail] = []
    by_community: List[dict] = []
    refund_breakdown: List[dict] = []
