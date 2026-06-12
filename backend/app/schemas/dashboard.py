from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import date


class DashboardStats(BaseModel):
    todo_count: int
    abnormal_count: int
    overdue_count: int
    gap_open_count: int
    submission_total: int
    gap_total: int
    completed_rate: float
    on_time_rate: float


class TodoItem(BaseModel):
    id: int
    type: str
    title: str
    deadline: date | None
    priority: str
    url: str
    extra: Dict[str, Any] = {}


class AbnormalItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    severity: str
    url: str


class TrendPoint(BaseModel):
    date: str
    submission_count: int
    gap_count: int
    completed_count: int


class TrendData(BaseModel):
    last_14_days: List[TrendPoint]
    by_risk_level: Dict[str, int]
    by_status: Dict[str, int]


class RiskBoardItem(BaseModel):
    id: int
    contract_name: str
    counterparty: str
    risk_level: str
    deadline: date | None
    days_left: int | None
    status: str
    gap_count: int
    critical_gap_count: int
    high_gap_count: int


class RiskBoard(BaseModel):
    total: int
    items: List[RiskBoardItem]
    summary: Dict[str, int]
    overdue: List[RiskBoardItem] = []
    within_3_days: List[RiskBoardItem] = []
    within_7_days: List[RiskBoardItem] = []
    after_7_days: List[RiskBoardItem] = []
    no_deadline: List[RiskBoardItem] = []


class DashboardResponse(BaseModel):
    stats: DashboardStats
    todos: List[TodoItem]
    abnormals: List[AbnormalItem]
    trend: TrendData
