from datetime import datetime, date
from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator

T = TypeVar("T")


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0
    total_pages: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)
    data: List[T]
    pagination: Pagination


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str = "farmer"
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PlotBase(BaseModel):
    code: str
    name: str
    area_mu: float
    location: Optional[str] = None
    soil_type: Optional[str] = None
    is_active: bool = True


class PlotCreate(PlotBase):
    pass


class PlotOut(PlotBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    created_by: Optional[int] = None


class VarietyBase(BaseModel):
    code: str
    name: str
    fruit_type: str
    plot_id: int
    plant_date: Optional[date] = None
    expected_yield_kg: Optional[float] = None
    maturity_days: Optional[int] = None
    is_active: bool = True
    description: Optional[str] = None

    @field_validator("plant_date", mode="before")
    @classmethod
    def parse_plant_date(cls, v):
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
                try:
                    return datetime.strptime(v, fmt).date()
                except (ValueError, TypeError):
                    continue
        return v


class VarietyCreate(VarietyBase):
    pass


class VarietyOut(VarietyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    created_by: Optional[int] = None


class HarvestRecordBase(BaseModel):
    code: str
    plot_id: int
    variety_id: int
    harvest_date: date
    status: str = "planned"
    weather: Optional[str] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    workers_count: Optional[int] = None
    actual_yield_kg: Optional[float] = None
    predicted_yield_kg: Optional[float] = None
    quality_score: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("harvest_date", mode="before")
    @classmethod
    def parse_harvest_date(cls, v):
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
                try:
                    return datetime.strptime(v, fmt).date()
                except (ValueError, TypeError):
                    continue
        return v


class HarvestRecordCreate(HarvestRecordBase):
    run_auto_chain: bool = True


class HarvestRecordOut(HarvestRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    yield_deviation_pct: Optional[float] = None
    created_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None


class HarvestBatchBase(BaseModel):
    code: str
    harvest_id: int
    variety_id: int
    batch_date: date
    status: str = "harvested"
    weight_kg: float
    container_count: Optional[int] = None
    storage_location: Optional[str] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("batch_date", mode="before")
    @classmethod
    def parse_batch_date(cls, v):
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
                try:
                    return datetime.strptime(v, fmt).date()
                except (ValueError, TypeError):
                    continue
        return v


class HarvestBatchCreate(HarvestBatchBase):
    run_auto_chain: bool = True


class HarvestBatchOut(HarvestBatchBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    handler_id: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None


class EnvReadingCreate(BaseModel):
    plot_id: int
    variety_id: int
    reading_time: Optional[str] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    ph_value: Optional[float] = None
    light_lux: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    rainfall_mm: Optional[float] = None
    sensor_id: Optional[str] = None


class EnvReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plot_id: int
    variety_id: int
    reading_time: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    ph_value: Optional[float] = None
    light_lux: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    rainfall_mm: Optional[float] = None
    sensor_id: Optional[str] = None


class ThresholdBase(BaseModel):
    variety_id: int
    metric: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    alert_level: str = "warning"
    is_active: bool = True
    description: Optional[str] = None


class ThresholdCreate(ThresholdBase):
    pass


class ThresholdOut(ThresholdBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    harvest_id: Optional[int] = None
    plot_id: int
    variety_id: int
    level: str
    status: str
    metric: str
    actual_value: float
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    message: str
    triggered_at: datetime
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_by: Optional[int] = None


class AlertAck(BaseModel):
    notes: Optional[str] = None


class YieldPredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    id: int
    harvest_id: int
    plot_id: int
    variety_id: int
    prediction_date: date
    predicted_yield_kg: float
    confidence_pct: Optional[float] = None
    model_version: str
    is_reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("prediction_date", mode="before")
    @classmethod
    def parse_prediction_date(cls, v):
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
                try:
                    return datetime.strptime(v, fmt).date()
                except (ValueError, TypeError):
                    continue
        return v


class SubsidyVoucherBase(BaseModel):
    code: str
    harvest_id: int
    batch_id: Optional[int] = None
    variety_id: int
    subsidy_type: str
    amount: float
    applicant_id: int
    documents_ref: Optional[str] = None
    review_notes: Optional[str] = None


class SubsidyVoucherCreate(SubsidyVoucherBase):
    run_auto_chain: bool = True


class SubsidyVoucherOut(SubsidyVoucherBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    reviewer_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    applied_at: datetime
    paid_at: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None


class SubsidyReview(BaseModel):
    status: str
    reviewer_id: int
    review_notes: Optional[str] = None


class SortingDiffBase(BaseModel):
    batch_id: int
    harvest_id: int
    variety_id: int
    reported_weight_kg: float
    actual_weight_kg: float
    reported_grade: Optional[str] = None
    actual_grade: Optional[str] = None
    remarks: str
    result: str
    social_impact: str = "none"
    impact_description: Optional[str] = None
    resolution: Optional[str] = None


class SortingDiffCreate(SortingDiffBase):
    handled_by: Optional[int] = None


class SortingDiffOut(SortingDiffBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    diff_weight_kg: float
    diff_pct: float
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    content: str
    notification_type: str
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    channel: str
    created_at: datetime


class DownloadRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    record_type: str
    file_name: str
    file_size_bytes: Optional[int] = None
    filters_used: Optional[str] = None
    downloaded_at: datetime
    include_demo: bool


class ThresholdUpdate(BaseModel):
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    alert_level: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class HarvestStatusUpdate(BaseModel):
    status: str


class AlertResolve(BaseModel):
    resolution_notes: Optional[str] = None
