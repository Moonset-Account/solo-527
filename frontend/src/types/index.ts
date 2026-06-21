export interface User {
  id: string;
  username: string;
  realName: string;
  role: number;
  roleText: string;
  shiftId?: string;
  shiftName?: string;
  isActive: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  model: string;
  status: number;
  statusText: string;
  currentWorkOrderCode?: string;
  currentMoldId?: string;
  moldCode?: string;
  currentShiftId?: string;
  shiftName?: string;
  location: string;
}

export interface ProcessStepInstance {
  id: string;
  workOrderId: string;
  workOrderCode: string;
  processStepTemplateId: string;
  stepName: string;
  stepCode: string;
  sequence: number;
  status: number;
  statusText: string;
  equipmentId?: string;
  equipmentCode?: string;
  equipmentName?: string;
  operatorId?: string;
  operatorName?: string;
  shiftId?: string;
  shiftName?: string;
  startedAt?: string;
  completedAt?: string;
  outputQuantity?: number;
  defectiveQuantity?: number;
  abnormalReason?: string;
  qrCode: string;
  createdAt: string;
}

export interface WorkReport {
  id: string;
  workOrderId: string;
  workOrderCode: string;
  operatorId: string;
  operatorName: string;
  equipmentId: string;
  equipmentName: string;
  shiftId: string;
  shiftName: string;
  completedQuantity: number;
  defectiveQuantity: number;
  workHours: number;
  status: number;
  statusText: string;
  remarks?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface DowntimeRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  reason: number;
  reasonText: string;
  reasonDetail?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  reporterId: string;
  reporterName: string;
  shiftId?: string;
  shiftName?: string;
  isLogged: boolean;
}

export interface WorkOrder {
  id: string;
  code: string;
  productName: string;
  productCode: string;
  plannedQuantity: number;
  completedQuantity: number;
  defectiveQuantity: number;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  assignedEquipmentId?: string;
  equipmentName?: string;
  assignedShiftId?: string;
  shiftName?: string;
  remarks?: string;
}

export interface ProductionStatistics {
  date: string;
  totalOutput: number;
  totalDefective: number;
  passRate: number;
  totalWorkHours: number;
  workOrderCount: number;
}

export interface EquipmentStatistics {
  equipmentId: string;
  equipmentName: string;
  runningHours: number;
  downtimeHours: number;
  utilizationRate: number;
  downtimeCount: number;
}

export interface ShiftPerformance {
  id: string;
  shiftId: string;
  shiftName: string;
  date: string;
  totalOutput: number;
  totalDefective: number;
  totalWorkHours: number;
  equipmentUtilizationRate: number;
  passRate: number;
}

export interface OperationLog {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  module: string;
  detail?: string;
  ipAddress?: string;
  isDowntimeRelated: boolean;
  createdAt: string;
}

export interface AdjustmentRecord {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  previousValue?: string;
  newValue: string;
  reason?: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

export interface MoldRecord {
  id: string;
  moldId: string;
  moldCode: string;
  recordType: string;
  previousValue?: string;
  newValue: string;
  description?: string;
  equipmentId?: string;
  equipmentName?: string;
  createdAt: string;
}

export interface QCResult {
  id: string;
  workOrderId: string;
  workOrderCode: string;
  processStepInstanceId: string;
  stepName: string;
  inspectorId: string;
  inspectorName: string;
  result: string;
  sampleSize: number;
  passCount: number;
  failCount: number;
  defectDescription?: string;
  remarks?: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}
