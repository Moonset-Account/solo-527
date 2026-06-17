export type UserRole = 'Admin' | 'Technician' | 'Operator' | 'Manager';

export type BatchStatus = 'Pending' | 'Harvesting' | 'Completed' | 'Cancelled';

export type AlertLevel = 'Info' | 'Warning' | 'Critical';

export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export type MaterialStatus = 'Missing' | 'Submitted' | 'Approved' | 'Rejected';

export type OrderStatus = 'Created' | 'Fulfilling' | 'Fulfilled' | 'Overdue';

export type OperationStatus = 'Success' | 'Failed' | 'PartialSuccess';

export type ParameterType = 'Temperature' | 'Humidity' | 'SoilMoisture' | 'LightIntensity' | 'Co2Level';

export type EnumType = 'batchStatus' | 'alertLevel' | 'alertStatus' | 'materialStatus' | 'orderStatus' | 'userRole';

export type Guid = string;

export interface FilterField {
  name: string;
  label: string;
  type: 'input' | 'search' | 'select' | 'dateRange';
  options?: Array<{ value: string | number; label: string }>;
}

export interface User {
  id: Guid;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  department: string;
  createdAt: string;
  isActive: boolean;
}

export interface Plot {
  id: Guid;
  plotCode: string;
  name: string;
  area: number;
  location: string;
  greenhouseName: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

export interface Variety {
  id: Guid;
  name: string;
  category: string;
  growthDays: number;
  description: string;
  createdAt: string;
}

export interface HarvestBatch {
  id: Guid;
  batchNumber: string;
  plotId: Guid;
  varietyId: Guid;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate: string;
  harvestDate?: string;
  expectedYield?: number;
  actualYield?: number;
  yield: number;
  remark?: string;
  status: BatchStatus;
  technicianId: Guid;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  plot?: Plot;
  variety?: Variety;
}

export interface EnvironmentData {
  id: Guid;
  plotId: Guid;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightIntensity: number;
  co2Level: number;
  recordedAt: string;
  plot?: Plot;
}

export interface Threshold {
  id: Guid;
  plotId: Guid;
  parameterType: string;
  minValue: number;
  maxValue: number;
  updatedAt: string;
  updatedBy: Guid;
}

export interface Alert {
  id: Guid;
  plotId: Guid;
  parameterType: string;
  currentValue: number;
  thresholdMin: number;
  thresholdMax: number;
  thresholdValue?: number;
  level: AlertLevel;
  message: string;
  status: AlertStatus;
  acknowledgedBy: Guid;
  acknowledgedAt: string;
  resolvedAt: string;
  createdAt: string;
  triggeredAt?: string;
  plot?: Plot;
}

export interface ApplicationMaterial {
  id: Guid;
  batchId: Guid;
  materialType: string;
  status: MaterialStatus;
  remark: string;
  processResult: string;
  submittedAt: string;
  processedAt: string;
  processedBy: Guid;
  batch?: HarvestBatch;
}

export interface Order {
  id: Guid;
  orderNumber: string;
  batchId: Guid;
  customerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  fulfillmentDate: string;
  createdAt: string;
  batch?: HarvestBatch;
}

export interface BatchOperationItem {
  id: Guid;
  batchOperationId: Guid;
  entityId: Guid;
  entityType: string;
  succeeded: boolean;
  errorMessage: string;
  retryCount: number;
  lastRetryAt: string;
}

export interface BatchOperationFailedItem {
  entityId: Guid;
  entityType: string;
  errorMessage: string;
}

export interface BatchOperation {
  id: Guid;
  operationType: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: OperationStatus;
  summary: string;
  operatorId: Guid;
  createdAt: string;
  items: BatchOperationItem[];
}

export interface DashboardStats {
  activePlots: number;
  activeBatches: number;
  activeAlerts: number;
  todayHarvestWeight: number;
  materialMissingCount: number;
  pendingOrdersCount: number;
}

export interface DashboardStatsDto extends DashboardStats {}

export interface MaterialStats {
  totalCount: number;
  missingCount: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface MaterialStatsDto extends MaterialStats {}

export interface FulfillmentStats {
  totalOrders: number;
  fulfilledCount: number;
  fulfillingCount: number;
  createdCount: number;
  overdueCount: number;
  totalAmount: number;
  fulfillmentRate: number;
}

export interface FulfillmentStatsDto extends FulfillmentStats {}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BatchOperationResult {
  operationId: Guid;
  status: OperationStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
  summary: string;
  failedItems: BatchOperationFailedItem[];
}

export interface BatchOperationResultDto {
  operationId: Guid;
  status: OperationStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
  summary: string;
  failedItems: BatchOperationFailedItem[];
}

export interface BatchFilterDto {
  batchNumber?: string;
  plotId?: Guid;
  varietyId?: Guid;
  status?: BatchStatus;
}

export interface OrderFilterDto {
  orderNumber?: string;
  status?: OrderStatus;
  batchId?: Guid;
}
