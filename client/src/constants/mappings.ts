import {
  BatchStatus,
  AlertLevel,
  AlertStatus,
  MaterialStatus,
  OrderStatus,
  OperationStatus,
  UserRole,
  ParameterType,
} from '@/types';

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  Pending: 'default',
  Harvesting: 'processing',
  Completed: 'success',
  Cancelled: 'error',
};

export const BATCH_STATUS_NAMES: Record<BatchStatus, string> = {
  Pending: '待处理',
  Harvesting: '采收中',
  Completed: '已完成',
  Cancelled: '已取消',
};

export const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  Info: 'blue',
  Warning: 'orange',
  Critical: 'red',
};

export const ALERT_LEVEL_NAMES: Record<AlertLevel, string> = {
  Info: '信息',
  Warning: '警告',
  Critical: '严重',
};

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  Active: 'red',
  Acknowledged: 'orange',
  Resolved: 'green',
};

export const ALERT_STATUS_NAMES: Record<AlertStatus, string> = {
  Active: '活跃',
  Acknowledged: '已确认',
  Resolved: '已解决',
};

export const MATERIAL_STATUS_COLORS: Record<MaterialStatus, string> = {
  Missing: 'error',
  Submitted: 'processing',
  Approved: 'success',
  Rejected: 'warning',
};

export const MATERIAL_STATUS_NAMES: Record<MaterialStatus, string> = {
  Missing: '缺失',
  Submitted: '已提交',
  Approved: '已通过',
  Rejected: '已拒绝',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  Created: 'default',
  Fulfilling: 'processing',
  Fulfilled: 'success',
  Overdue: 'error',
};

export const ORDER_STATUS_NAMES: Record<OrderStatus, string> = {
  Created: '已创建',
  Fulfilling: '履约中',
  Fulfilled: '已履约',
  Overdue: '已逾期',
};

export const OPERATION_STATUS_COLORS: Record<OperationStatus, string> = {
  Success: 'success',
  Failed: 'error',
  PartialSuccess: 'warning',
};

export const OPERATION_STATUS_NAMES: Record<OperationStatus, string> = {
  Success: '成功',
  Failed: '失败',
  PartialSuccess: '部分成功',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  Admin: 'magenta',
  Technician: 'geekblue',
  Operator: 'purple',
  Manager: 'gold',
};

export const USER_ROLE_NAMES: Record<UserRole, string> = {
  Admin: '管理员',
  Technician: '农技员',
  Operator: '操作员',
  Manager: '经理',
};

export const PARAMETER_TYPE_NAMES: Record<ParameterType, string> = {
  Temperature: '温度',
  Humidity: '湿度',
  SoilMoisture: '土壤湿度',
  LightIntensity: '光照',
  Co2Level: 'CO2',
};

export const PARAMETER_TYPE_UNITS: Record<ParameterType, string> = {
  Temperature: '°C',
  Humidity: '%',
  SoilMoisture: '%',
  LightIntensity: 'lux',
  Co2Level: 'ppm',
};

export const PARAMETER_TYPE_THRESHOLDS: Record<ParameterType, { min: number; max: number }> = {
  Temperature: { min: 10, max: 35 },
  Humidity: { min: 30, max: 80 },
  SoilMoisture: { min: 20, max: 70 },
  LightIntensity: { min: 5000, max: 80000 },
  Co2Level: { min: 300, max: 1500 },
};
