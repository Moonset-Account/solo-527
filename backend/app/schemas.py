from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class PlotBase(BaseModel):
    name: str
    code: str
    area: Optional[float] = None
    greenhouse_type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "active"
    description: Optional[str] = None


class PlotCreate(PlotBase):
    pass


class PlotUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = None
    greenhouse_type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class Plot(PlotBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VarietyBase(BaseModel):
    name: str
    code: str
    category: Optional[str] = None
    growth_cycle_days: Optional[int] = None
    optimal_temp_min: Optional[float] = None
    optimal_temp_max: Optional[float] = None
    optimal_humidity_min: Optional[float] = None
    optimal_humidity_max: Optional[float] = None
    expected_yield: Optional[float] = None
    description: Optional[str] = None


class VarietyCreate(VarietyBase):
    pass


class VarietyUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    growth_cycle_days: Optional[int] = None
    optimal_temp_min: Optional[float] = None
    optimal_temp_max: Optional[float] = None
    optimal_humidity_min: Optional[float] = None
    optimal_humidity_max: Optional[float] = None
    expected_yield: Optional[float] = None
    description: Optional[str] = None


class Variety(VarietyBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BatchBase(BaseModel):
    batch_no: str
    plot_id: int
    variety_id: int
    plant_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    status: Optional[str] = "growing"
    planting_quantity: Optional[int] = None
    predicted_yield: Optional[float] = None
    actual_yield: Optional[float] = None
    remark: Optional[str] = None
    process_result: Optional[str] = None


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    plant_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    status: Optional[str] = None
    planting_quantity: Optional[int] = None
    predicted_yield: Optional[float] = None
    actual_yield: Optional[float] = None
    remark: Optional[str] = None
    process_result: Optional[str] = None


class BatchListItem(BatchBase):
    id: int
    plot_name: Optional[str] = None
    variety_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Batch(BatchBase):
    id: int
    plot: Optional[Plot] = None
    variety: Optional[Variety] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnvironmentDataBase(BaseModel):
    plot_id: int
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture: Optional[float] = None
    light_intensity: Optional[float] = None
    co2_concentration: Optional[float] = None


class EnvironmentDataCreate(EnvironmentDataBase):
    pass


class EnvironmentData(EnvironmentDataBase):
    id: int
    record_time: datetime
    plot: Optional[Plot] = None

    class Config:
        from_attributes = True


class EnvironmentAlertBase(BaseModel):
    plot_id: int
    alert_type: str
    alert_level: Optional[str] = "warning"
    metric: Optional[str] = None
    current_value: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    message: Optional[str] = None
    is_handled: Optional[bool] = False


class EnvironmentAlertCreate(EnvironmentAlertBase):
    pass


class EnvironmentAlertUpdate(BaseModel):
    is_handled: Optional[bool] = None
    handled_by: Optional[int] = None


class EnvironmentAlert(EnvironmentAlertBase):
    id: int
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime
    plot: Optional[Plot] = None

    class Config:
        from_attributes = True


class SortingOrderBase(BaseModel):
    order_no: str
    batch_id: int
    quantity: float
    unit: Optional[str] = "kg"
    quality_level: Optional[str] = None
    target_market: Optional[str] = None
    status: Optional[str] = "pending"
    handler_id: Optional[int] = None
    scheduled_time: Optional[datetime] = None
    completed_time: Optional[datetime] = None
    remark: Optional[str] = None


class SortingOrderCreate(SortingOrderBase):
    pass


class SortingOrderUpdate(BaseModel):
    quantity: Optional[float] = None
    quality_level: Optional[str] = None
    target_market: Optional[str] = None
    status: Optional[str] = None
    handler_id: Optional[int] = None
    scheduled_time: Optional[datetime] = None
    completed_time: Optional[datetime] = None
    remark: Optional[str] = None


class SortingOrderListItem(SortingOrderBase):
    id: int
    batch_no: Optional[str] = None
    variety_name: Optional[str] = None
    plot_name: Optional[str] = None
    created_at: datetime


class SortingOrder(SortingOrderBase):
    id: int
    batch: Optional[Batch] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MachineReservationBase(BaseModel):
    reservation_no: str
    machine_name: str
    machine_type: Optional[str] = None
    applicant: Optional[str] = None
    plot_id: Optional[int] = None
    purpose: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "pending"
    operator: Optional[str] = None
    remark: Optional[str] = None


class MachineReservationCreate(MachineReservationBase):
    pass


class MachineReservationUpdate(BaseModel):
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None
    purpose: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    operator: Optional[str] = None
    remark: Optional[str] = None


class MachineReservation(MachineReservationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FarmRecordBase(BaseModel):
    record_no: str
    batch_id: int
    record_type: str
    title: str
    content: Optional[str] = None
    operator_id: Optional[int] = None
    record_time: datetime
    weather: Optional[str] = None
    materials_used: Optional[str] = None


class FarmRecordCreate(FarmRecordBase):
    pass


class FarmRecordUpdate(BaseModel):
    record_type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    record_time: Optional[datetime] = None
    weather: Optional[str] = None
    materials_used: Optional[str] = None


class FarmRecordListItem(FarmRecordBase):
    id: int
    batch_no: Optional[str] = None
    variety_name: Optional[str] = None
    operator_name: Optional[str] = None
    created_at: datetime


class FarmRecord(FarmRecordBase):
    id: int
    batch: Optional[Batch] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TodoItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    category: Optional[str] = None
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    due_time: Optional[datetime] = None
    is_completed: Optional[bool] = False
    assignee: Optional[str] = None


class TodoItemCreate(TodoItemBase):
    pass


class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None
    assignee: Optional[str] = None


class TodoItem(TodoItemBase):
    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class YieldStats(BaseModel):
    total_predicted: float = 0
    total_actual: float = 0
    by_variety: List[dict] = []
    by_plot: List[dict] = []
    by_month: List[dict] = []


class DashboardStats(BaseModel):
    pending_todos_count: int = 0
    overdue_alerts_count: int = 0
    recent_records_count: int = 0
    active_plots_count: int = 0
    growing_batches_count: int = 0
    pending_orders_count: int = 0
