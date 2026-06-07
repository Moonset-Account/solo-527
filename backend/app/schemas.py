from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time


class CleanerBase(BaseModel):
    name: str
    employee_id: str
    shift: str
    is_active: bool = True


class CleanerOut(CleanerBase):
    id: int
    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    room_number: str
    floor: int
    room_type: str
    is_vip: bool = False
    status: str = "dirty"


class RoomOut(RoomBase):
    id: int
    class Config:
        from_attributes = True


class WorkOrderBase(BaseModel):
    order_number: str
    room_id: int
    cleaner_id: int
    shift: str
    is_late_checkout: bool = False
    is_vip: bool = False
    assigned_at: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    inspection_time: Optional[datetime] = None
    cleaning_duration: Optional[float] = None
    date: date
    note: Optional[str] = None


class WorkOrderOut(WorkOrderBase):
    id: int
    status: str
    room: Optional[RoomOut] = None
    cleaner: Optional[CleanerOut] = None
    reworks: List["ReworkOut"] = []
    class Config:
        from_attributes = True


class ReworkBase(BaseModel):
    work_order_id: int
    reason: str
    missing_item: Optional[str] = None
    rework_time: datetime
    minutes_after_inspection: Optional[float] = None
    reassigned_cleaner_id: Optional[int] = None
    rework_duration: Optional[float] = None
    floor: Optional[int] = None
    room_type: Optional[str] = None
    is_vip: bool = False


class ReworkOut(ReworkBase):
    id: int
    class Config:
        from_attributes = True


class ShiftHandoverBase(BaseModel):
    work_order_id: int
    from_cleaner_id: int
    to_cleaner_id: int
    handover_time: datetime
    from_duration: Optional[float] = None
    to_duration: Optional[float] = None
    note: Optional[str] = None


class ShiftHandoverOut(ShiftHandoverBase):
    id: int
    from_cleaner: Optional[CleanerOut] = None
    to_cleaner: Optional[CleanerOut] = None
    class Config:
        from_attributes = True


class WorkOrderDetailOut(WorkOrderOut):
    handovers: List[ShiftHandoverOut] = []


WorkOrderOut.model_rebuild()
WorkOrderDetailOut.model_rebuild()


class FilterParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    floor: Optional[int] = None
    shift: Optional[str] = None
    is_vip: Optional[bool] = None
    is_late_checkout: Optional[bool] = None
    cleaner_id: Optional[int] = None


class FloorHeatmapCell(BaseModel):
    room_number: str
    floor: int
    room_type: str
    is_vip: bool
    is_late_checkout: bool
    status: str
    avg_duration: Optional[float] = None
    rework_count: int = 0


class ReworkTrendPoint(BaseModel):
    date: str
    rework_rate_vip: Optional[float] = None
    rework_rate_normal: Optional[float] = None
    rework_rate_total: Optional[float] = None
    avg_duration_vip: Optional[float] = None
    avg_duration_normal: Optional[float] = None
    top_reasons: List[dict] = []


class ShiftComparisonItem(BaseModel):
    shift: str
    total_orders: int
    avg_duration_vip: Optional[float] = None
    avg_duration_normal: Optional[float] = None
    rework_rate_vip: Optional[float] = None
    rework_rate_normal: Optional[float] = None


class CleanerPerformance(BaseModel):
    cleaner_id: int
    cleaner_name: str
    shift: str
    total_orders: int
    vip_orders: int = 0
    normal_orders: int = 0
    avg_duration: Optional[float] = None
    avg_duration_vip: Optional[float] = None
    avg_duration_normal: Optional[float] = None
    rework_count: int = 0
    rework_rate: Optional[float] = None
    rework_rate_vip: Optional[float] = None
    rework_rate_normal: Optional[float] = None
    handover_count: int = 0
    handover_from_duration_total: Optional[float] = None
    handover_to_duration_total: Optional[float] = None
    avg_minutes_after_inspection: Optional[float] = None
