export type AlertLevel = 'critical' | 'warning' | 'info';
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'ignored';
export type MeterStatus = 'online' | 'offline' | 'maintenance';
export type DeviceType = 'inverter' | 'panel' | 'meter' | 'battery' | 'transformer';

export interface Zone {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Meter {
  id: string;
  zoneId: string;
  name: string;
  model: string;
  serialNumber: string;
  status: MeterStatus;
  lastHeartbeat?: string;
  installedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  zoneId: string;
  meterId?: string;
  name: string;
  type: DeviceType;
  model: string;
  serialNumber: string;
  status: 'running' | 'stopped' | 'fault' | 'maintenance';
  capacity: number;
  installedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  zoneId: string;
  level: AlertLevel;
  title: string;
  description?: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  assignee?: string;
  sourceData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertActivity {
  id: string;
  alertId: string;
  operatorId: string;
  operatorName: string;
  action: 'create' | 'acknowledge' | 'assign' | 'resolve' | 'ignore' | 'comment';
  note?: string;
  createdAt: string;
}

export interface EnergyRecord {
  id: string;
  meterId: string;
  zoneId: string;
  timestamp: string;
  production: number;
  consumption: number;
  gridExport: number;
  gridImport: number;
  efficiency: number;
}

export interface SubsidyRecord {
  id: string;
  zoneId: string;
  periodStart: string;
  periodEnd: string;
  productionKwh: number;
  subsidyRate: number;
  subsidyAmount: number;
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface EnergySavingTarget {
  id: string;
  zoneId?: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  targetKwh: number;
  baselineKwh: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnergySavingDetail {
  id: string;
  targetId: string;
  date: string;
  actualKwh: number;
  baselineKwh: number;
  savedKwh: number;
  zoneId?: string;
  deviceId?: string;
}

export interface MeterOfflineRecord {
  id: string;
  meterId: string;
  zoneId: string;
  offlineAt: string;
  onlineAt?: string;
  durationMinutes?: number;
  reason: string;
  reasonCategory: 'network' | 'power' | 'hardware' | 'software' | 'maintenance' | 'unknown';
  assignee?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  responseMinutes?: number;
  resolutionNote?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  page: string;
  filters: Record<string, any>;
  userId: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
