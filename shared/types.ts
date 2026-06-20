export type AlertStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ABNORMAL_CLOSED';

export type AlertLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type StrategyStatus = 'ACTIVE' | 'INACTIVE';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'ANALYST';

export interface ProcessingLog {
  id: string;
  alertId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  remark: string;
  timestamp: string;
}

export interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  alertLevel: AlertLevel;
  alertType: string;
  title: string;
  description: string;
  status: AlertStatus;
  handlerId?: string;
  handlerName?: string;
  responseDurationSeconds?: number;
  createdAt: string;
  updatedAt: string;
  processingLogs?: ProcessingLog[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerCondition: Record<string, any>;
  action: Record<string, any>;
  status: StrategyStatus;
  version: number;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueRecord {
  id: string;
  date: string;
  zoneId: string;
  zoneName: string;
  deviceId?: string;
  deviceName?: string;
  chargeEnergy: number;
  dischargeEnergy: number;
  revenue: number;
  subsidy: number;
  hasGap: boolean;
  gapReason?: string;
  gapDurationSeconds?: number;
  responsiblePerson?: string;
  createdAt: string;
}

export interface SubsidyRecord {
  id: string;
  period: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  zoneId: string;
  zoneName: string;
  description: string;
  createdAt: string;
}

export interface MeterZone {
  id: string;
  name: string;
  code: string;
  location: string;
  deviceCount: number;
  onlineCount: number;
  totalCapacity: number;
  status: 'NORMAL' | 'WARNING' | 'ERROR';
  createdAt: string;
}

export interface DashboardStats {
  totalAlerts: number;
  pendingAlerts: number;
  processingAlerts: number;
  completedAlerts: number;
  abnormalClosedAlerts: number;
  alertProcessingRate: number;
  totalRevenue: number;
  todayRevenue: number;
  onlineDeviceRate: number;
  activeStrategies: number;
}

export interface TrendDataPoint {
  date: string;
  alerts: number;
  revenue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  ABNORMAL_CLOSED: '异常关闭',
};

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  INFO: '信息',
  WARNING: '警告',
  ERROR: '错误',
  CRITICAL: '严重',
};

export const STRATEGY_STATUS_LABELS: Record<StrategyStatus, string> = {
  ACTIVE: '运行中',
  INACTIVE: '已停用',
};
