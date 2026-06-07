from pydantic import BaseModel
from typing import Optional


class SummaryRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    shift: Optional[str] = None
    device: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None


class SummaryResponse(BaseModel):
    total_packages: int
    total_sorted: int
    total_errors: int
    error_rate: float
    alarm_count: int
    review_failed: int
    error_rate_change: float
    alarm_count_change: float


class TrendRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    granularity: Optional[str] = "hour"
    shift: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None
    device: Optional[str] = None


class TrendResponse(BaseModel):
    timestamps: list[str]
    error_counts: list[int]
    error_rates: list[float]
    total_counts: list[int]
    alarm_periods: list[dict]


class HeatmapRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    metric: Optional[str] = "error_rate"
    shift: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None
    device: Optional[str] = None


class HeatmapResponse(BaseModel):
    slots: list[str]
    time_periods: list[str]
    values: list[list[float]]


class ShiftRankRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    shift: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None
    device: Optional[str] = None


class ShiftRankItem(BaseModel):
    shift: str
    total_sorted: int
    error_count: int
    error_rate: float
    alarm_count: int
    rank: int


class ShiftRankResponse(BaseModel):
    data: list[ShiftRankItem]


class AlarmCorrelationRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    shift: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None
    device: Optional[str] = None


class SankeyNode(BaseModel):
    name: str
    category: str


class SankeyLink(BaseModel):
    source: str
    target: str
    value: int


class AlarmCorrelationResponse(BaseModel):
    nodes: list[SankeyNode]
    links: list[SankeyLink]


class ExportRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    data_type: str = "summary"
    shift: Optional[str] = None
    slot: Optional[str] = None
    route: Optional[str] = None
    device: Optional[str] = None


class ExportTaskResponse(BaseModel):
    task_id: str
    status: str
    download_url: Optional[str] = None
