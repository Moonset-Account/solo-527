from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class FloorBase(BaseModel):
    floor_number: int
    floor_name: str
    total_seats: int
    description: Optional[str] = None


class FloorCreate(FloorBase):
    pass


class Floor(FloorBase):
    id: int

    class Config:
        from_attributes = True


class AreaBase(BaseModel):
    area_name: str
    floor_id: int
    total_seats: int
    seat_type: str


class AreaCreate(AreaBase):
    pass


class Area(AreaBase):
    id: int

    class Config:
        from_attributes = True


class SeatBase(BaseModel):
    seat_code: str
    area_id: int
    seat_type: str
    has_power: bool = True
    has_window: bool = False
    is_disabled: bool = False
    grid_x: Optional[int] = None
    grid_y: Optional[int] = None


class SeatCreate(SeatBase):
    pass


class Seat(SeatBase):
    id: int

    class Config:
        from_attributes = True


class ReservationFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    floor_id: Optional[int] = None
    area_id: Optional[int] = None
    seat_type: Optional[str] = None
    user_group_id: Optional[int] = None
    time_slot: Optional[str] = None
    is_exam_week: Optional[bool] = None


class HeatmapData(BaseModel):
    grid_x: int
    grid_y: int
    value: float
    seat_code: str
    sample_size: int


class TrendPoint(BaseModel):
    date: date
    value: float
    sample_size: int
    is_exam_week: bool


class AreaComparison(BaseModel):
    area_name: str
    utilization_rate: float
    no_show_rate: float
    avg_wait_time: float
    sample_size: int
    seat_count: int


class FunnelStep(BaseModel):
    name: str
    value: int
    conversion_rate: float


class AnomalyItem(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    metric_value: float
    baseline_value: float
    change_percent: float
    related_dimension: str
    related_id: Optional[int] = None
    date: date
    sample_size: int


class ReportData(BaseModel):
    filters: dict
    generation_time: datetime
    sample_size: int
    data: dict
