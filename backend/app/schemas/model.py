from pydantic import BaseModel
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime, date

if TYPE_CHECKING:
    from app.schemas.data import AppointmentResponse


class ModelVersionBase(BaseModel):
    version: str
    model_name: str = "LightGBM"
    description: Optional[str] = None


class ModelVersionCreate(ModelVersionBase):
    hyperparameters: Optional[Dict[str, Any]] = None
    feature_columns: Optional[List[str]] = None


class ModelVersionUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None
    review_status: Optional[str] = None
    review_comment: Optional[str] = None


class ModelMetrics(BaseModel):
    auc: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    ks: Optional[float] = None


class ModelVersionResponse(ModelVersionBase):
    id: int
    hyperparameters: Optional[Dict[str, Any]] = None
    feature_columns: Optional[List[str]] = None
    training_sample_count: int = 0
    training_date_range_start: Optional[datetime] = None
    training_date_range_end: Optional[datetime] = None
    metrics_auc: Optional[float] = None
    metrics_accuracy: Optional[float] = None
    metrics_precision: Optional[float] = None
    metrics_recall: Optional[float] = None
    metrics_f1: Optional[float] = None
    metrics_ks: Optional[float] = None
    is_active: bool = False
    is_rollback: bool = False
    rollback_from_version: Optional[str] = None
    model_file_path: Optional[str] = None
    created_by: Optional[int] = None
    review_status: str = "pending"
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ModelTrainRequest(BaseModel):
    version: str
    description: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    test_size: float = 0.2
    random_state: int = 42


class ModelTrainResponse(BaseModel):
    version: str
    training_sample_count: int
    metrics: ModelMetrics
    feature_importance: List[Dict[str, Any]]
    model_file_path: str


class RollbackRequest(BaseModel):
    target_version: str
    reason: str


class RiskScoreBase(BaseModel):
    appointment_id: int
    risk_score: float
    risk_level: str
    risk_threshold: float = 0.5


class RiskScoreResponse(RiskScoreBase):
    id: int
    model_version_id: int
    top_features: Optional[List[Dict[str, Any]]] = None
    recommendation: Optional[str] = None
    sms_template_id: Optional[int] = None
    needs_callback: bool = False
    is_override: bool = False
    override_reason: Optional[str] = None
    batch_id: Optional[str] = None
    scoring_time_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskScoreDetail(RiskScoreResponse):
    appointment: Optional["AppointmentResponse"] = None
    shap_values: Optional[List[Dict[str, Any]]] = None


class ScoringRequest(BaseModel):
    appointment_ids: List[int]
    model_version_id: Optional[int] = None
    batch_size: int = 100


class ScoringResponse(BaseModel):
    total_count: int
    success_count: int
    failed_count: int
    batch_id: str
    risk_distribution: Dict[str, int] = {}


from app.schemas.data import AppointmentResponse

