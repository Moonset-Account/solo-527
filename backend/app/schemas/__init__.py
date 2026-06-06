from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RoomBase(BaseSchema):
    name: str
    building: str
    capacity: Optional[int] = None


class Room(RoomBase):
    id: str
    created_at: datetime


class DeviceBase(BaseSchema):
    name: str
    type: str
    room_id: Optional[str] = None
    status: str = "online"
    last_seen: Optional[datetime] = None


class Device(DeviceBase):
    id: str
    created_at: datetime


class EnergyDataBase(BaseSchema):
    device_id: Optional[str] = None
    timestamp: datetime
    value: float
    category: str
    is_estimated: bool = False


class EnergyData(EnergyDataBase):
    id: str
    created_at: datetime


class AlarmBase(BaseSchema):
    device_id: Optional[str] = None
    level: str
    message: str
    timestamp: datetime
    status: str = "active"


class Alarm(AlarmBase):
    id: str
    device_name: Optional[str] = None
    created_at: datetime


class WorkorderBase(BaseSchema):
    title: str
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    assignee: Optional[str] = None


class Workorder(WorkorderBase):
    id: str
    created_at: datetime
    related_alarm_ids: Optional[List[str]] = None


class ScheduleBase(BaseSchema):
    room_id: Optional[str] = None
    course_name: str
    start_time: datetime
    end_time: datetime
    student_count: Optional[int] = None
    week_type: str = "normal"


class Schedule(ScheduleBase):
    id: str
    created_at: datetime


class AnomalyBase(BaseSchema):
    energy_data_id: Optional[str] = None
    timestamp: datetime
    value: float
    expected_value: Optional[float] = None
    deviation: Optional[float] = None
    severity: str = "medium"
    comment: Optional[str] = None


class AnomalyDetail(AnomalyBase):
    id: str
    possible_causes: List[str] = []
    related_schedule: List[Schedule] = []
    related_alarms: List[Alarm] = []
    related_workorders: List[Workorder] = []
    ac_strategy: Optional[dict] = None
    created_at: datetime


class ACStrategyBase(BaseSchema):
    room_id: Optional[str] = None
    timestamp: datetime
    target_temp: Optional[float] = None
    mode: Optional[str] = None
    fan_speed: Optional[str] = None


class ACStrategy(ACStrategyBase):
    id: str
    created_at: datetime


class OverviewMetrics(BaseSchema):
    totalEnergy: float
    pue: float
    onlineDevices: int
    pendingWorkorders: int
    energyTrend: List[float]
    comparedToYesterday: float


class EnergyTrendPoint(BaseSchema):
    timestamp: datetime
    value: float
    category: str
    deviceId: Optional[str] = None
    isOffline: bool = False


class EnergyBreakdownItem(BaseSchema):
    category: str
    value: float
    percentage: float


class FilterOptions(BaseSchema):
    rooms: List[Room]
    weekTypes: List[str]
    deviceTypes: List[str]


class AnomalyCommentRequest(BaseSchema):
    comment: str


class ExportPDFRequest(BaseSchema):
    start_time: datetime
    end_time: datetime
    room_ids: Optional[str] = None
    include_maintenance: bool = False
    week_type: Optional[str] = None
    include_charts: bool = True
