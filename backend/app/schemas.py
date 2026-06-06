from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .models import UserRole, TaskStatus, TaskType


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.RUNNER


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None


class RunnerProfileBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    weekly_mileage: Optional[float] = None
    target_race: Optional[str] = None
    target_date: Optional[datetime] = None


class RunnerProfileCreate(RunnerProfileBase):
    pass


class RunnerProfileResponse(RunnerProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class PaceZoneBase(BaseModel):
    zone_name: str
    min_pace: str
    max_pace: str
    description: Optional[str] = None


class PaceZoneCreate(PaceZoneBase):
    pass


class PaceZoneResponse(PaceZoneBase):
    id: int
    runner_profile_id: int

    class Config:
        from_attributes = True


class TrainingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    plan_date: datetime
    distance_km: Optional[float] = None
    target_pace: Optional[str] = None
    warm_up: Optional[str] = None
    main_set: Optional[str] = None
    cool_down: Optional[str] = None


class TrainingPlanCreate(TrainingPlanBase):
    pass


class TrainingPlanResponse(TrainingPlanBase):
    id: int
    created_by: int
    created_at: datetime
    is_published: bool

    class Config:
        from_attributes = True


class CheckinBase(BaseModel):
    training_plan_id: Optional[int] = None
    distance_km: float
    duration_seconds: Optional[int] = None
    avg_pace: Optional[str] = None
    avg_heart_rate: Optional[int] = None
    perceived_effort: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    track_points: Optional[List[Dict[str, Any]]] = None
    location_alias: Optional[str] = None


class CheckinCreate(CheckinBase):
    pass


class CheckinUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    pace_analysis: Optional[Dict[str, Any]] = None


class CheckinResponse(CheckinBase):
    id: int
    runner_id: int
    checkin_date: datetime
    status: TaskStatus
    pace_analysis: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    activity_date: datetime
    meeting_point: Optional[str] = None
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: int
    created_by: int
    created_at: datetime
    is_published: bool

    class Config:
        from_attributes = True


class ActivitySignupBase(BaseModel):
    activity_id: int
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None


class ActivitySignupCreate(ActivitySignupBase):
    pass


class ActivitySignupUpdate(BaseModel):
    status: Optional[TaskStatus] = None


class ActivitySignupResponse(ActivitySignupBase):
    id: int
    runner_id: int
    signed_up_at: datetime
    status: TaskStatus

    class Config:
        from_attributes = True


class InjuryNoteBase(BaseModel):
    injury_type: str
    injury_date: Optional[datetime] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    treatment_notes: Optional[str] = None
    expected_recovery_date: Optional[datetime] = None
    is_active: Optional[bool] = True


class InjuryNoteCreate(InjuryNoteBase):
    runner_id: int


class InjuryNoteUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    resolved_at: Optional[datetime] = None
    injury_type: Optional[str] = None
    injury_date: Optional[datetime] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    treatment_notes: Optional[str] = None
    expected_recovery_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class InjuryNoteResponse(InjuryNoteBase):
    id: int
    runner_id: int
    reported_by: int
    reported_at: datetime
    is_resolved: bool

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    task_type: TaskType
    assigned_user_id: Optional[int] = None
    related_id: Optional[int] = None
    priority: int = 0
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    title: Optional[str] = None
    notes: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskBoardResponse(BaseModel):
    new: List[TaskResponse]
    pending_confirm: List[TaskResponse]
    in_progress: List[TaskResponse]
    exception_review: List[TaskResponse]
    archived: List[TaskResponse]


class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    retry_count: int

    class Config:
        from_attributes = True


class PaceAnalysisResponse(BaseModel):
    avg_pace: str
    pace_zones_coverage: Dict[str, float]
    improvement_suggestions: List[str]
    training_intensity: str
