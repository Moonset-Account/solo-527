export interface TemperatureRange {
  min: number;
  max: number;
  unit: string;
}

export interface MetricConfig {
  name: string;
  description: string;
  calculation: string;
  sourceTables: string[];
  refreshInterval: number;
  dataRange: TemperatureRange;
  thresholds: {
    warning: number;
    critical: number;
  };
}

export interface DataQualityConfig {
  requiredFields: Record<string, string[]>;
  sampleSizeThreshold: number;
  completenessThreshold: number;
}

export const TEMPERATURE_CONFIG: TemperatureRange = {
  min: 0,
  max: 8,
  unit: '°C',
};

export const METRICS_CONFIG: Record<string, MetricConfig> = {
  activeVehicles: {
    name: '在途车辆数',
    description: '当前处于运行状态的冷链运输车辆数量',
    calculation: 'COUNT(vehicles WHERE status = "running")',
    sourceTables: ['vehicles'],
    refreshInterval: 300000,
    dataRange: { min: 0, max: 100, unit: '辆' },
    thresholds: { warning: 5, critical: 1 },
  },
  temperatureAnomalyRate: {
    name: '温度异常率',
    description: '温度记录中超出生鲜冷链正常范围的比例',
    calculation: '异常温度记录数 / 总温度记录数 * 100%',
    sourceTables: ['temperature_records'],
    refreshInterval: 60000,
    dataRange: { min: 0, max: 100, unit: '%' },
    thresholds: { warning: 5, critical: 15 },
  },
  avgDeliveryDuration: {
    name: '平均配送时长',
    description: '从发车到签收的平均运输时间',
    calculation: 'AVG(actual_arrival - start_time)',
    sourceTables: ['delivery_batches'],
    refreshInterval: 300000,
    dataRange: { min: 0, max: 1440, unit: '分钟' },
    thresholds: { warning: 480, critical: 720 },
  },
  onTimeRate: {
    name: '准时送达率',
    description: '实际送达时间不晚于预计送达时间的批次比例',
    calculation: '准时批次数量 / 已完成批次数量 * 100%',
    sourceTables: ['delivery_batches'],
    refreshInterval: 300000,
    dataRange: { min: 0, max: 100, unit: '%' },
    thresholds: { warning: 90, critical: 75 },
  },
  pendingAnomalies: {
    name: '待处理异常',
    description: '状态为待处理的异常事件数量',
    calculation: 'COUNT(anomaly_events WHERE status = "pending")',
    sourceTables: ['anomaly_events'],
    refreshInterval: 60000,
    dataRange: { min: 0, max: 100, unit: '件' },
    thresholds: { warning: 5, critical: 15 },
  },
};

export const DATA_QUALITY_CONFIG: DataQualityConfig = {
  requiredFields: {
    temperature_records: ['id', 'vehicle_id', 'batch_id', 'probe_id', 'timestamp', 'temperature'],
    position_records: ['id', 'vehicle_id', 'timestamp', 'lat', 'lng', 'speed'],
    door_records: ['id', 'vehicle_id', 'batch_id', 'open_time'],
    anomaly_events: ['id', 'batch_id', 'vehicle_id', 'type', 'start_time', 'severity'],
    delivery_batches: ['id', 'vehicle_id', 'route_id', 'customer_id', 'start_time', 'estimated_arrival'],
  },
  sampleSizeThreshold: 100,
  completenessThreshold: 95,
};

export const ANOMALY_TYPES = {
  temp_high: { label: '温度过高', color: '#FF4D4F', severity: 'high' },
  temp_low: { label: '温度过低', color: '#1890FF', severity: 'medium' },
  door_open: { label: '异常开门', color: '#FAAD14', severity: 'medium' },
  delay: { label: '配送延迟', color: '#722ED1', severity: 'low' },
};

export const CALIBRATION_STATUS = {
  valid: { label: '校准有效', color: '#52C41A' },
  expiring: { label: '即将到期', color: '#FAAD14' },
  expired: { label: '已过期', color: '#FF4D4F' },
};
