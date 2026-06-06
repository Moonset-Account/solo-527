from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from decimal import Decimal


class FilterParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    store_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None
    product_categories: Optional[List[str]] = None
    warehouse_ids: Optional[List[int]] = None
    logistics_providers: Optional[List[str]] = None
    return_reasons_level1: Optional[List[str]] = None
    return_reasons_level2: Optional[List[str]] = None
    status: Optional[List[str]] = None


class ReturnReasonNode(BaseModel):
    name: str
    value: int
    amount: float
    children: Optional[List["ReturnReasonNode"]] = None


class CycleDistributionItem(BaseModel):
    bucket: str
    count: int
    avg_days: float


class ProductRankItem(BaseModel):
    product_id: int
    product_name: str
    return_count: int
    return_rate: float
    return_amount: float


class ServiceDurationItem(BaseModel):
    agent_name: Optional[str] = None
    avg_duration: float
    median_duration: float
    case_count: int


class DimensionStats(BaseModel):
    dimension: str
    name: str
    count: int
    amount: float
    avg_cycle_days: float


class DashboardOverview(BaseModel):
    total_returns: int
    total_return_amount: float
    return_rate: float
    avg_refund_cycle_days: float
    avg_service_duration_hours: float
    repeat_return_user_count: int


class ChartDataResponse(BaseModel):
    overview: DashboardOverview
    reason_tree: List[ReturnReasonNode]
    cycle_distribution: List[CycleDistributionItem]
    product_ranking: List[ProductRankItem]
    service_duration: List[ServiceDurationItem]
    dimension_stats: Dict[str, List[DimensionStats]]
    applied_filters: Dict[str, Any]


class SavedViewCreate(BaseModel):
    name: str
    filters: Dict[str, Any]
    is_public: bool = False


class SavedViewResponse(BaseModel):
    id: int
    name: str
    filters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    is_public: bool

    class Config:
        from_attributes = True


class ReportExportRequest(BaseModel):
    filters: Dict[str, Any]
    report_type: str = "summary"
    format: str = "xlsx"
