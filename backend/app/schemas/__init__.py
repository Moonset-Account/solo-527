from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int


class TeamBase(BaseModel):
    name: str
    leader: Optional[str] = None
    phone: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HazardTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_fine_amount: Optional[float] = 0


class HazardTypeCreate(HazardTypeBase):
    pass


class HazardTypeResponse(HazardTypeBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InspectionPointBase(BaseModel):
    name: str
    floor: int
    area: Optional[str] = None
    description: Optional[str] = None


class InspectionPointCreate(InspectionPointBase):
    pass


class InspectionPointResponse(InspectionPointBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    role: str = "viewer"
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None
    is_sensitive: bool = False


class AttachmentCreate(AttachmentBase):
    hazard_id: str


class AttachmentResponse(AttachmentBase):
    id: str
    uploaded_by: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RectificationRecordBase(BaseModel):
    description: str


class RectificationRecordCreate(RectificationRecordBase):
    hazard_id: str
    photo_ids: Optional[List[str]] = []


class RectificationRecordResponse(RectificationRecordBase):
    id: str
    hazard_id: str
    submitted_by: str
    submitted_at: datetime
    reviewer: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    status: str
    reject_reason: Optional[str] = None
    photos: Optional[List[AttachmentResponse]] = []
    
    model_config = ConfigDict(from_attributes=True)


class AppealRecordBase(BaseModel):
    reason: str


class AppealRecordCreate(AppealRecordBase):
    hazard_id: str


class AppealRecordResponse(AppealRecordBase):
    id: str
    hazard_id: str
    submitted_by: str
    submitted_at: datetime
    status: str
    handled_by: Optional[str] = None
    handled_at: Optional[datetime] = None
    remark: Optional[str] = None
    weather_evidence: Optional[dict] = None
    stop_work_evidence: Optional[dict] = None
    
    model_config = ConfigDict(from_attributes=True)


class FineBase(BaseModel):
    hazard_id: str
    amount: float
    reason: str


class FineCreate(FineBase):
    pass


class FineResponse(FineBase):
    id: str
    status: str
    team_id: str
    team_name: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    reject_reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class HazardListItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    level: str
    status: str
    is_overdue: bool
    deadline: Optional[datetime] = None
    discovered_at: datetime
    fine_amount: Optional[float] = 0
    fine_status: Optional[str] = None
    
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    type_id: Optional[str] = None
    type_name: Optional[str] = None
    inspection_point_id: Optional[str] = None
    inspection_point_floor: Optional[int] = None
    inspection_point_name: Optional[str] = None


class HazardDetail(HazardListItem):
    discoverer_id: Optional[str] = None
    discoverer_name: Optional[str] = None
    
    discovery_photos: Optional[List[AttachmentResponse]] = []
    rectification_records: Optional[List[RectificationRecordResponse]] = []
    appeal_records: Optional[List[AppealRecordResponse]] = []
    reject_reasons: Optional[List[str]] = []


class PaginatedHazardList(BaseModel):
    items: List[HazardListItem]
    total: int
    page: int
    page_size: int


class DashboardStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    under_review: int
    closed: int
    overdue: int
    closure_rate: int
    overdue_rate: int
    total_confirmed_fine: float
    total_pending_fine: float


class ClosureRateTrendItem(BaseModel):
    date: str
    new_hazards: int
    closed_hazards: int
    closure_rate: float


class OverdueRankingItem(BaseModel):
    team_id: str
    team_name: str
    overdue_count: int


class FloorHeatmapItem(BaseModel):
    floor: int
    hazard_count: int
    level_1_count: int
    level_2_count: int
    level_3_count: int


class TeamTrendItem(BaseModel):
    date: str
    team_id: str
    team_name: str
    hazard_count: int
    completed_count: int = 0


class FineStatistics(BaseModel):
    total_confirmed: float
    total_pending: float
    by_team: List[dict]
    by_type: List[dict]
    by_month: List[dict]


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class WeatherRecord(BaseModel):
    date: str
    weather: str
    temperature: str
    wind_speed: Optional[str] = None
    is_workable: bool


class StopWorkRecord(BaseModel):
    date: str
    reason: str
    duration_hours: float
    is_official: bool
