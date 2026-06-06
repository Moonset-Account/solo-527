from pydantic import BaseModel, Field
from typing import Optional, Generic, TypeVar, List
from datetime import datetime, date

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "success"
    data: Optional[T] = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "success"
    data: List[T]
    total: int
    page: int
    page_size: int


class DashboardStats(BaseModel):
    total_cleaning_tasks: int
    completed_cleaning_tasks: int
    overdue_cleaning_tasks: int
    total_maintenance_orders: int
    completed_maintenance_orders: int
    overdue_maintenance_orders: int
    total_cost: float
    cleaner_utilization: float
    technician_utilization: float


class CleanerPerformanceItem(BaseModel):
    cleaner_id: int
    cleaner_name: str
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    avg_duration_hours: float
    overdue_count: int
    overdue_rate: float


class ReportQuery(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    community: Optional[str] = None
    cleaner_id: Optional[int] = None
    technician_id: Optional[int] = None
