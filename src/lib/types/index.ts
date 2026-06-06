export type SensorType = 'temperature' | 'humidity' | 'light' | 'soil_moisture';

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance';

export type ValveStatus = 'open' | 'closed' | 'fault';

export type CropPhase = 'sowing' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';

export type AlertLevel = 'info' | 'warning' | 'critical';

export type DataQuality = 'good' | 'missing' | 'outlier' | 'anomaly';

export interface Greenhouse {
  id: string;
  name: string;
  location: string;
  area: number;
  createdAt: string;
  sensorCount: number;
  valveCount: number;
}

export interface Sensor {
  id: string;
  greenhouseId: string;
  name: string;
  type: SensorType;
  unit: string;
  location: string;
  status: DeviceStatus;
  lastSeen: string;
  samplingInterval: number;
  thresholdMin: number;
  thresholdMax: number;
  installedAt: string;
}

export interface IrrigationValve {
  id: string;
  greenhouseId: string;
  name: string;
  zone: string;
  status: ValveStatus;
  flowRate: number;
  lastOpened: string;
  lastClosed: string;
  totalWaterToday: number;
}

export interface CropBatch {
  id: string;
  greenhouseId: string;
  cropType: string;
  variety: string;
  sowingDate: string;
  expectedHarvestDate: string;
  phase: CropPhase;
  plantCount: number;
  expectedYield: number;
  actualYield?: number;
  status: 'active' | 'completed' | 'failed';
}

export interface SensorReading {
  id: string;
  sensorId: string;
  greenhouseId: string;
  timestamp: string;
  value: number;
  quality: DataQuality;
  isMissing: boolean;
  isOutlier: boolean;
  batchId?: string;
}

export interface IrrigationEvent {
  id: string;
  valveId: string;
  greenhouseId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  waterVolume: number;
  reason: string;
  batchId?: string;
}

export interface Alert {
  id: string;
  greenhouseId: string;
  sensorId?: string;
  valveId?: string;
  type: 'threshold' | 'offline' | 'valve_fault' | 'anomaly';
  level: AlertLevel;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  readingId?: string;
}

export interface FilterState {
  greenhouseIds: string[];
  sensorIds: string[];
  cropTypes: string[];
  timeRange: { start: string; end: string };
  deviceStatuses: DeviceStatus[];
  sensorTypes: SensorType[];
  batchIds: string[];
  showAnomalies: boolean;
  showMissing: boolean;
}

export interface DataUpdateInfo {
  lastUpdateTime: string;
  recordCount: number;
  sensorCount: number;
  missingCount: number;
  anomalyCount: number;
  dataRange: { start: string; end: string };
}

export interface MetricConfig {
  key: SensorType;
  name: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  idealMin: number;
  idealMax: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  includeMetadata: boolean;
  includeCharts: boolean;
  filters: FilterState;
  dataUpdateInfo: DataUpdateInfo;
}

export interface UserPermission {
  userId: string;
  role: 'admin' | 'technician' | 'viewer';
  allowedGreenhouses: string[];
  canExport: boolean;
  canImport: boolean;
  canConfigure: boolean;
}
