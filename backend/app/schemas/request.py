from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel

from app.models import (
    RequestType, RequestStatus, ApprovalStage,
    DeviceStatus, AlertSeverity, AlertStatus,
    VulnerabilitySeverity, VulnerabilityStatus
)


class ChangeRequestBase(BaseModel):
    request_type: RequestType
    title: str
    description: str


class AccountChangeCreate(ChangeRequestBase):
    target_account: str
    change_type: str
    change_details: Optional[Dict[str, Any]] = None


class FaultReportCreate(ChangeRequestBase):
    fault_level: Optional[str] = None
    fault_device: Optional[str] = None


class ChangeRequestCreate(BaseModel):
    request_type: RequestType
    title: str
    description: str
    target_account: Optional[str] = None
    change_type: Optional[str] = None
    change_details: Optional[Dict[str, Any]] = None
    fault_level: Optional[str] = None
    fault_device: Optional[str] = None


class ChangeWindowUpdate(BaseModel):
    change_window_start: datetime
    change_window_end: datetime


class ChangeWindowApprove(BaseModel):
    approved: bool
    comment: Optional[str] = None


class RollbackPlanUpdate(BaseModel):
    rollback_plan: str


class RollbackPlanApprove(BaseModel):
    approved: bool
    comment: Optional[str] = None


class ImplementationResult(BaseModel):
    implementation_result: str
    is_rolled_back: Optional[bool] = False
    rollback_reason: Optional[str] = None


class ChangeRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None


class ApprovalRecordResponse(BaseModel):
    id: int
    request_id: int
    approver_id: int
    approver_name: Optional[str] = None
    stage: ApprovalStage
    action: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChangeRequestResponse(BaseModel):
    id: int
    request_type: RequestType
    title: str
    description: str
    status: RequestStatus
    current_stage: ApprovalStage
    requester_id: int
    requester_name: Optional[str] = None

    target_account: Optional[str] = None
    change_type: Optional[str] = None
    change_details: Optional[Dict[str, Any]] = None

    change_window_start: Optional[datetime] = None
    change_window_end: Optional[datetime] = None
    change_window_approved: Optional[bool] = False
    change_window_comment: Optional[str] = None

    rollback_plan: Optional[str] = None
    rollback_plan_approved: Optional[bool] = False
    rollback_plan_comment: Optional[str] = None

    implementation_result: Optional[str] = None
    is_rolled_back: Optional[bool] = False
    rollback_reason: Optional[str] = None

    fault_level: Optional[str] = None
    fault_device: Optional[str] = None

    approval_records: List[ApprovalRecordResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeviceInspectionBase(BaseModel):
    device_name: str
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[DeviceStatus] = DeviceStatus.NORMAL
    location: Optional[str] = None
    last_inspection: Optional[datetime] = None
    next_inspection: Optional[datetime] = None
    inspection_cycle_days: Optional[int] = 30
    remarks: Optional[str] = None
    config_details: Optional[Dict[str, Any]] = None


class DeviceInspectionCreate(DeviceInspectionBase):
    pass


class DeviceInspectionUpdate(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[DeviceStatus] = None
    location: Optional[str] = None
    last_inspection: Optional[datetime] = None
    next_inspection: Optional[datetime] = None
    inspection_cycle_days: Optional[int] = None
    remarks: Optional[str] = None
    config_details: Optional[Dict[str, Any]] = None


class DeviceInspectionResponse(DeviceInspectionBase):
    id: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Optional[AlertSeverity] = AlertSeverity.MEDIUM
    source: Optional[str] = None
    device_name: Optional[str] = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    status: Optional[AlertStatus] = None
    source: Optional[str] = None
    device_name: Optional[str] = None


class AlertConfirm(BaseModel):
    comment: Optional[str] = None


class AlertResolve(BaseModel):
    resolution: str


class AlertResponse(AlertBase):
    id: int
    status: AlertStatus
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    confirmed_comment: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VulnerabilityBase(BaseModel):
    title: str
    description: Optional[str] = None
    cve_id: Optional[str] = None
    severity: Optional[VulnerabilitySeverity] = VulnerabilitySeverity.MEDIUM
    affected_devices: Optional[List[str]] = None
    fix_plan: Optional[str] = None


class VulnerabilityCreate(VulnerabilityBase):
    pass


class VulnerabilityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cve_id: Optional[str] = None
    severity: Optional[VulnerabilitySeverity] = None
    status: Optional[VulnerabilityStatus] = None
    affected_devices: Optional[List[str]] = None
    fix_plan: Optional[str] = None
    fix_result: Optional[str] = None


class VulnerabilityFix(BaseModel):
    fix_result: str


class VulnerabilityResponse(VulnerabilityBase):
    id: int
    status: VulnerabilityStatus
    fix_result: Optional[str] = None
    fixed_by: Optional[int] = None
    fixed_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
