import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class RouteStopOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    stop_order: int
    building: str
    meal_count: int
    elder_name: Optional[str] = None
    has_dietary_conflict: bool = False
    conflict_details: Optional[str] = None

    class Config:
        from_attributes = True


class RouteBase(BaseModel):
    name: str
    date: date
    courier_id: Optional[uuid.UUID] = None


class RouteCreate(RouteBase):
    stop_elder_ids: list[uuid.UUID] = []


class RouteAssignCourier(BaseModel):
    courier_id: uuid.UUID


class RouteOut(RouteBase):
    id: uuid.UUID
    status: str
    total_stops: int
    created_at: datetime
    stops: list[RouteStopOut] = []
    courier_name: Optional[str] = None

    class Config:
        from_attributes = True


class RouteOverviewBuilding(BaseModel):
    building: str
    elder_count: int
    meal_count: int
    dietary_conflicts: int
    unsigned_count: int


class RouteOverviewColdBox(BaseModel):
    id: uuid.UUID
    serial_number: str
    current_temp: float
    is_abnormal: bool


class RouteOverview(BaseModel):
    route_id: uuid.UUID
    route_name: str
    route_date: date
    status: str
    buildings: list[RouteOverviewBuilding]
    total_meals: int
    total_conflicts: int
    cold_box: Optional[RouteOverviewColdBox]
    unsigned_list: list[dict]


class TodayDashboard(BaseModel):
    routes: list[RouteOut]
    buildings: list[RouteOverviewBuilding]
    total_meals: int
    total_conflicts: int
    cold_box_abnormal_count: int
    cold_box_abnormal_list: list[RouteOverviewColdBox]
    unsigned_list: list[dict]


class CourierOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    is_active: bool

    class Config:
        from_attributes = True
