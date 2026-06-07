from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str
    name: str
    role: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class HazardTypeBase(BaseModel):
    name: str
    code: str
    level: str


class HazardTypeResponse(HazardTypeBase):
    id: str
    
    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    name: str
    leader: str
    phone: Optional[str] = None


class TeamResponse(TeamBase):
    id: str
    
    class Config:
        from_attributes = True


class InspectionPointBase(BaseModel):
    name: str
    floor: int
    area: Optional[str] = None
    coordinates: Optional[Any] = None


class InspectionPointResponse(InspectionPointBase):
    id: str
    
    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    name: str
    url: str
    type: str
    sensitive: bool = False


class AttachmentResponse(AttachmentBase):
    id: str
    uploaded_at: datetime
    uploaded_by: str
    
    class Config:
        from_attributes = True


class RectificationRecordBase(BaseModel):
    description: str


class RectificationRecordResponse(BaseModel):
    id: str
    hazard_id: str
    description: str
    submitted_at: datetime
    submitted_by: str
    review_result: Optional[str] = None
    review_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    photos: List[AttachmentResponse] = []
    
    class Config:
        from_attributes = True


class AppealRecordBase(BaseModel):
    reason: str


class AppealRecordResponse(BaseModel):
    id: str
    hazard_id: str
    reason: str
    status: str
    created_at: datetime
    handled_at: Optional[datetime] = None
    handled_by: Optional[str] = None
    handle_remark: Optional[str] = None
    
    class Config:
        from_attributes = True


class WeatherRecordResponse(BaseModel):
    date: date
    weather: str
    temperature: Optional[int] = None
    wind_level: Optional[int] = None
    rain_volume: Optional[int] = None
    
    class Config:
        from_attributes = True


class StopWorkRecordResponse(BaseModel):
    id: str
    start_date: date
    end_date: date
    reason: str
    
    class Config:
        from_attributes = True


class HazardBase(BaseModel):
    title: str
    description: Optional[str] = None
    type_id: str
    level: str
    inspection_point_id: str
    team_id: str
    deadline: datetime


class HazardListItem(BaseModel):
    id: str
    code: str
    title: str
    level: str
    status: str
    discovered_at: datetime
    deadline: datetime
    is_overdue: bool
    type: HazardTypeResponse
    inspection_point: InspectionPointResponse
    team: TeamResponse
    
    class Config:
        from_attributes = True


class HazardDetailResponse(HazardListItem):
    description: Optional[str] = None
    discoverer: str
    closed_at: Optional[datetime] = None
    fine_amount: Optional[float] = None
    fine_status: Optional[str] = None
    reject_reasons: List[str] = []
    discovery_photos: List[AttachmentResponse] = []
    rectification_records: List[RectificationRecordResponse] = []
    appeal_records: List[AppealRecordResponse] = []


class DashboardStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    under_review: int
    closed: int
    overdue: int
    closure_rate: float
    overdue_rate: float
    total_confirmed_fine: float
    total_pending_fine: float


class ClosureRateTrendItem(BaseModel):
    date: str
    rate: float
    closed: int
    total: int


class OverdueRankingItem(BaseModel):
    team_id: str
    team_name: str
    count: int
    amount: float


class FloorHeatmapItem(BaseModel):
    floor: int
    count: int
    points: List[dict]


class TeamTrendItem(BaseModel):
    team: str
    team_id: str
    date: str
    completed: int
    total: int


class FineResponse(BaseModel):
    id: str
    hazard_id: str
    hazard_code: str
    hazard_title: str
    amount: float
    status: str
    team_name: str
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FineStatistics(BaseModel):
    total_confirmed: float
    total_pending: float
    by_team: List[dict]
    by_type: List[dict]
    by_month: List[dict]


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int


class SubmitRectificationRequest(BaseModel):
    description: str
    photo_ids: List[str] = []


class ReviewRequest(BaseModel):
    result: str  # pass, reject
    reason: Optional[str] = None


class AppealHandleRequest(BaseModel):
    result: str  # approved, rejected
    remark: Optional[str] = None


class FilterCriteria(BaseModel):
    date_range: Optional[List[str]] = None
    floors: Optional[List[int]] = None
    team_ids: Optional[List[str]] = None
    type_ids: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    levels: Optional[List[str]] = None
    keyword: Optional[str] = None
