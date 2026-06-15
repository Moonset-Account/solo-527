
export enum OrderStatus {
  Pending = 'Pending',
  InProduction = 'InProduction',
  QualityInspecting = 'QualityInspecting',
  QualityFailed = 'QualityFailed',
  Completed = 'Completed',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export enum ProductionStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Paused = 'Paused',
  Completed = 'Completed',
  Skipped = 'Skipped'
}

export enum EquipmentStatus {
  Idle = 'Idle',
  InUse = 'InUse',
  Maintenance = 'Maintenance',
  Faulty = 'Faulty',
  Offline = 'Offline'
}

export enum InspectionResult {
  Pass = 'Pass',
  Fail = 'Fail',
  PartialPass = 'PartialPass',
  Pending = 'Pending'
}

export enum QualityIssueStatus {
  Open = 'Open',
  Investigating = 'Investigating',
  Handling = 'Handling',
  Reviewed = 'Reviewed',
  Closed = 'Closed'
}

export enum DeliveryStatus {
  Pending = 'Pending',
  Scheduled = 'Scheduled',
  InTransit = 'InTransit',
  Delivered = 'Delivered',
  Returned = 'Returned',
  Failed = 'Failed'
}

export enum BatchOperationStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Processing = 'Processing',
  Completed = 'Completed',
  PartiallyCompleted = 'PartiallyCompleted',
  Cancelled = 'Cancelled'
}

export enum BatchItemStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Success = 'Success',
  Failed = 'Failed'
}

export enum BatchOperationType {
  StartProduction = 'StartProduction',
  CompleteProduction = 'CompleteProduction',
  MarkAsDelivered = 'MarkAsDelivered',
  UpdateDeliveryDate = 'UpdateDeliveryDate',
  ExportOrders = 'ExportOrders'
}

export interface StoreDto {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  isActive: boolean;
  orderCount?: number;
  totalAmount?: number;
}

export interface OrderDto {
  id: number;
  orderNo: string;
  storeId: number;
  storeName: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  specifications: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  materialRequirements: string;
  specialRequirements: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateOrderDto {
  storeId: number;
  customerName: string;
  customerPhone: string;
  productName: string;
  specifications: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  materialRequirements: string;
  specialRequirements: string;
  orderDate: string;
  deliveryDate: string;
  remarks?: string | null;
}

export interface ProductionNodeDto {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  estimatedDurationMinutes: number;
  description?: string | null;
  isActive: boolean;
}

export interface ProductionProgressDto {
  id: number;
  orderId: number;
  productionNodeId: number;
  productionNodeName: string;
  status: ProductionStatus;
  startTime?: string | null;
  endTime?: string | null;
  operator?: string | null;
  remarks?: string | null;
  equipmentId?: number | null;
  equipmentName?: string | null;
}

export interface UpdateProductionProgressDto {
  id: number;
  status: ProductionStatus;
  startTime?: string | null;
  endTime?: string | null;
  operator?: string | null;
  remarks?: string | null;
  equipmentId?: number | null;
}

export interface EquipmentDto {
  id: number;
  name: string;
  code: string;
  type: string;
  status: EquipmentStatus;
  location?: string | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  remarks?: string | null;
  isActive: boolean;
}

export interface QualityInspectionDto {
  id: number;
  orderId: number;
  inspector: string;
  inspectionDate: string;
  result: InspectionResult;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  checkItems?: string | null;
  remarks?: string | null;
  createdAt: string;
  qualityIssue?: QualityIssueDto | null;
}

export interface CreateQualityInspectionDto {
  orderId: number;
  inspector: string;
  inspectionDate: string;
  result: InspectionResult;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  checkItems?: string | null;
  remarks?: string | null;
}

export interface QualityIssueDto {
  id: number;
  qualityInspectionId: number;
  affectedScope: string;
  issueDescription: string;
  rootCause: string;
  handlingPath: string;
  correctiveAction: string;
  preventiveAction: string;
  reviewNotes: string;
  status: QualityIssueStatus;
  handler: string;
  reviewer: string;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CreateQualityIssueDto {
  qualityInspectionId: number;
  affectedScope: string;
  issueDescription: string;
  rootCause: string;
  handlingPath: string;
  correctiveAction: string;
  preventiveAction: string;
  reviewNotes: string;
  status: QualityIssueStatus;
  handler: string;
  reviewer: string;
}

export interface DeliveryTrackingDto {
  id: number;
  orderId: number;
  status: DeliveryStatus;
  scheduledDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  deliveryMethod?: string | null;
  trackingNo?: string | null;
  receiver?: string | null;
  receiverPhone?: string | null;
  deliveryAddress?: string | null;
  signature?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface OrderDetailDto extends OrderDto {
  productionProgresses: ProductionProgressDto[];
  qualityInspections: QualityInspectionDto[];
  deliveryTrackings: DeliveryTrackingDto[];
  equipmentAssignments: EquipmentAssignmentDto[];
}

export interface EquipmentAssignmentDto {
  id: number;
  orderId: number;
  equipmentId: number;
  equipmentName: string;
  productionNodeId?: number | null;
  productionNodeName?: string | null;
  assignTime: string;
  releaseTime?: string | null;
  operator?: string | null;
  remarks?: string | null;
}

export interface StoreSummaryDto {
  storeId: number;
  storeName: string;
  totalOrders: number;
  pendingOrders: number;
  inProductionOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  qualityFailedOrders: number;
  totalAmount: number;
  overdueOrders: number;
}

export interface DeliveryReminderDto {
  orderId: number;
  orderNo: string;
  storeName: string;
  productName: string;
  quantity: number;
  deliveryDate: string;
  status: OrderStatus;
  daysRemaining: number;
  isOverdue: boolean;
  reminderLevel: string;
}

export interface BatchOperationItemDto {
  id: number;
  orderId: number;
  orderNo: string;
  status: BatchItemStatus;
  errorMessage?: string | null;
  canRetry: boolean;
  retryCount: number;
  processedAt?: string | null;
}

export interface BatchProcessRequest {
  operationName: string;
  operator: string;
  orderIds: number[];
  operationType: BatchOperationType;
  remarks?: string | null;
}

export interface BatchProcessResult {
  batchOperationId: number;
  successCount: number;
  failedCount: number;
  failedItems: BatchOperationItemDto[];
}
