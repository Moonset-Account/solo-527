export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'completed' | 'cancelled';

export interface OrderProcess {
  id: string;
  orderId: string;
  processName: string;
  processRequirement?: string;
  equipment?: string;
  sortOrder?: number;
  processParams?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface DeliveryRequirement {
  id: string;
  orderId: string;
  requirementType: string;
  requirementContent: string;
  isMandatory: boolean;
  sortOrder?: number;
  extraFields?: Record<string, any>;
}

export interface Customer extends BaseEntity {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  remark?: string;
  extraFields?: Record<string, any>;
}

export type PriceListStatus = 'active' | 'inactive';

export interface PriceList extends BaseEntity {
  customerId: string;
  productName: string;
  productSpec?: string;
  unitPrice: number;
  priceUnit: string;
  minQuantity?: number;
  remark?: string;
  status: PriceListStatus;
  extraFields?: Record<string, any>;
}

export interface Order extends BaseEntity {
  orderNo: string;
  customerId: string;
  salespersonId?: string;
  productName: string;
  productSpec?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalAmount?: number;
  orderDate: Date;
  deliveryDate: Date;
  deliveryAddress?: string;
  status: OrderStatus;
  remark?: string;
  urgentLevel: number;
  extraFields?: Record<string, any>;
  customer?: Customer;
  salesperson?: User;
  processes?: OrderProcess[];
  deliveryRequirements?: DeliveryRequirement[];
  productionProgress?: ProductionProgress[];
  qualityInspections?: QualityInspection[];
  materialShortages?: MaterialShortage[];
  materialCosts?: MaterialCost[];
}

export interface OrderQueryParams extends PaginationParams {
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  urgentLevel?: number;
}

export interface CreateOrderDto {
  customerId: string;
  salespersonId?: string;
  productName: string;
  productSpec?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalAmount?: number;
  orderDate: string | Date;
  deliveryDate: string | Date;
  deliveryAddress?: string;
  remark?: string;
  urgentLevel?: number;
  extraFields?: Record<string, any>;
  processes?: Omit<OrderProcess, 'id' | 'orderId'>[];
  deliveryRequirements?: Omit<DeliveryRequirement, 'id' | 'orderId'>[];
}

export type UpdateOrderDto = Partial<CreateOrderDto>;

export type NodeType = 'process' | 'quality' | 'packaging' | 'delivery';

export interface ProductionNode extends BaseEntity {
  nodeName: string;
  nodeCode: string;
  nodeType: NodeType;
  nodeDescription?: string;
  estimatedHours?: number;
  sortOrder?: number;
  isActive: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'paused' | 'delayed' | 'skipped' | 'cancelled';

export interface ProductionProgress extends BaseEntity {
  orderId: string;
  nodeId?: string;
  teamId?: string;
  nodeName: string;
  status: ProgressStatus;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  completedQuantity?: number;
  defectQuantity?: number;
  remark?: string;
  sortOrder?: number;
  progressData?: Record<string, any>;
  extraFields?: Record<string, any>;
  order?: Order;
  productionNode?: ProductionNode;
  team?: Team;
}

export interface ProgressQueryParams extends PaginationParams {
  orderId?: string;
  status?: ProgressStatus;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export type TeamType = 'printing' | 'cutting' | 'binding' | 'packaging' | 'quality' | 'maintenance';

export interface Team extends BaseEntity {
  teamName: string;
  teamCode: string;
  teamType: TeamType;
  teamLeader?: string;
  leaderPhone?: string;
  memberCount: number;
  members?: Record<string, any>[];
  isActive: boolean;
  capacityConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'overtime';

export interface TeamSchedule extends BaseEntity {
  teamId: string;
  orderId?: string;
  taskName?: string;
  scheduleDate: Date;
  shift: ShiftType;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  actualQuantity?: number;
  status: ScheduleStatus;
  remark?: string;
  extraFields?: Record<string, any>;
  team?: Team;
}

export interface ScheduleQueryParams extends PaginationParams {
  teamId?: string;
  status?: ScheduleStatus;
  startDate?: string;
  endDate?: string;
  shift?: ShiftType;
}

export type MaterialCategory = 'paper' | 'ink' | 'plate' | 'chemical' | 'packaging' | 'other';

export interface Material extends BaseEntity {
  materialName: string;
  materialCode: string;
  category: MaterialCategory;
  materialSpec?: string;
  stockUnit?: string;
  safetyStock: number;
  currentStock: number;
  supplier?: string;
  isActive: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface MaterialQueryParams extends PaginationParams {
  category?: MaterialCategory;
  supplier?: string;
  isLowStock?: boolean;
  isActive?: boolean;
}

export interface MaterialCost extends BaseEntity {
  orderId: string;
  materialId: string;
  materialName: string;
  materialSpec?: string;
  quantityUsed: number;
  unit?: string;
  unitCost: number;
  totalCost: number;
  costDate?: Date;
  remark?: string;
  extraFields?: Record<string, any>;
  material?: Material;
  order?: Order;
}

export interface MaterialCostQueryParams extends PaginationParams {
  materialId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MaterialCostStats {
  totalCost: number;
  totalQuantity: number;
  costByMaterial?: Array<{ materialId: string; materialName: string; totalCost: number; totalQuantity: number }>;
  costByDate?: Array<{ date: string; totalCost: number }>;
}

export type InspectionResult = 'passed' | 'failed' | 'partial' | 'pending';

export interface QualityInspection extends BaseEntity {
  orderId: string;
  nodeId?: string;
  inspectionType: string;
  inspectionItem?: string;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  passRate?: number;
  result: InspectionResult;
  defectDescription?: string;
  handlingSuggestion?: string;
  inspector?: string;
  inspectionTime?: Date;
  inspectionData?: Record<string, any>;
  extraFields?: Record<string, any>;
  order?: Order;
}

export interface QualityQueryParams extends PaginationParams {
  orderId?: string;
  result?: InspectionResult;
  inspectionType?: string;
  startDate?: string;
  endDate?: string;
}

export interface QualityStatisticsResult {
  totalInspections: number;
  passedCount: number;
  failedCount: number;
  partialCount: number;
  pendingCount: number;
  overallPassRate: number;
  statsByType?: Array<{ inspectionType: string; total: number; passed: number; passRate: number }>;
  statsByDate?: Array<{ date: string; total: number; passed: number; passRate: number }>;
}

export type ShortageStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MaterialShortage extends BaseEntity {
  orderId: string;
  materialId: string;
  materialName: string;
  materialSpec?: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  impactLevel: ImpactLevel;
  impactScope: string;
  responsiblePerson: string;
  responsiblePhone?: string;
  resolutionPath: string;
  expectedResolutionTime?: Date;
  actualResolutionTime?: Date;
  status: ShortageStatus;
  resolutionResult?: string;
  remark?: string;
  extraFields?: Record<string, any>;
  order?: Order;
  material?: Material;
}

export interface ShortageQueryParams extends PaginationParams {
  status?: ShortageStatus;
  impactLevel?: ImpactLevel;
  orderId?: string;
  materialId?: string;
}

export interface ShortageStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byImpactLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export type ConfigCategory = 'order' | 'production' | 'quality' | 'material' | 'team' | 'delivery' | 'export' | 'other';
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'textarea';

export interface SystemConfig extends BaseEntity {
  configKey: string;
  configName: string;
  category: ConfigCategory;
  fieldType: FieldType;
  configValue?: string;
  defaultValue?: string;
  fieldOptions?: Record<string, any>;
  validationRules?: Record<string, any>;
  thresholdConfig?: Record<string, any>;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

export interface SystemConfigQueryParams extends PaginationParams {
  category?: ConfigCategory;
  isActive?: boolean;
}

export type ExportType = 'order' | 'production' | 'material' | 'quality' | 'customer' | 'other';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface ExportRecord extends BaseEntity {
  exportName: string;
  exportType: ExportType;
  exportFormat: ExportFormat;
  filterCriteria: Record<string, any>;
  exportFields?: string[];
  recordCount: number;
  filePath?: string;
  fileName?: string;
  operator: string;
  operatorRole?: string;
  exportTime: Date;
  extraInfo?: Record<string, any>;
}

export interface ExportRecordQueryParams extends PaginationParams {
  exportType?: ExportType;
  operator?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderExportDto {
  filterCriteria: Record<string, any>;
  exportFields?: string[];
  operator: string;
  operatorRole?: string;
}

export type UserRole = 'admin' | 'sales' | 'production' | 'quality' | 'warehouse' | 'operator';

export interface User extends BaseEntity {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  extraFields?: Record<string, any>;
}

export type PaginatedResponse<T> = PaginatedResult<T>;

export const statusMap: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_production: '生产中',
  quality_check: '质检中',
  completed: '已完成',
  cancelled: '已取消',
};

export const urgentLevelMap: Record<number, string> = {
  0: '普通',
  1: '较急',
  2: '紧急',
  3: '特急',
};

export const progressStatusMap: Record<ProgressStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  paused: '已暂停',
  delayed: '已延期',
  skipped: '已跳过',
  cancelled: '已取消',
};

export const inspectionResultMap: Record<InspectionResult, string> = {
  passed: '合格',
  failed: '不合格',
  partial: '部分合格',
  pending: '待检测',
};

export const shortageStatusMap: Record<ShortageStatus, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const impactLevelMap: Record<ImpactLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const materialCategoryMap: Record<MaterialCategory, string> = {
  paper: '纸张',
  ink: '油墨',
  plate: '印版',
  chemical: '化学品',
  packaging: '包装材料',
  other: '其他',
};
