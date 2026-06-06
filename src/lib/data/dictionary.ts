import type { MetricConfig, SensorType } from '$lib/types';

export const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  temperature: '温度',
  humidity: '湿度',
  light: '光照',
  soil_moisture: '土壤水分'
};

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'temperature',
    name: '空气温度',
    unit: '°C',
    color: '#ef4444',
    min: -10,
    max: 50,
    idealMin: 18,
    idealMax: 28
  },
  {
    key: 'humidity',
    name: '空气湿度',
    unit: '%',
    color: '#3b82f6',
    min: 0,
    max: 100,
    idealMin: 60,
    idealMax: 85
  },
  {
    key: 'light',
    name: '光照强度',
    unit: 'lux',
    color: '#f59e0b',
    min: 0,
    max: 100000,
    idealMin: 10000,
    idealMax: 60000
  },
  {
    key: 'soil_moisture',
    name: '土壤水分',
    unit: '%',
    color: '#22c55e',
    min: 0,
    max: 100,
    idealMin: 40,
    idealMax: 70
  }
];

export const DEVICE_STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中'
};

export const VALVE_STATUS_LABELS: Record<string, string> = {
  open: '开启',
  closed: '关闭',
  fault: '故障'
};

export const CROP_PHASE_LABELS: Record<string, string> = {
  sowing: '播种期',
  germination: '发芽期',
  vegetative: '营养生长期',
  flowering: '开花期',
  fruiting: '结果期',
  harvest: '采收期'
};

export const ALERT_LEVEL_LABELS: Record<string, string> = {
  info: '信息',
  warning: '警告',
  critical: '严重'
};

export const DATA_QUALITY_LABELS: Record<string, string> = {
  good: '正常',
  missing: '缺失',
  outlier: '异常值',
  anomaly: '异常'
};

export const DATA_DICTIONARY = {
  sensor_readings: {
    description: '传感器读数表',
    fields: {
      id: { type: 'string', description: '唯一标识', nullable: false },
      sensorId: { type: 'string', description: '传感器ID', nullable: false },
      greenhouseId: { type: 'string', description: '温室ID', nullable: false },
      timestamp: { type: 'datetime', description: '采集时间', nullable: false },
      value: { type: 'float', description: '读数数值', nullable: false },
      quality: { type: 'enum', description: '数据质量', nullable: false },
      isMissing: { type: 'boolean', description: '是否缺失值', nullable: false },
      isOutlier: { type: 'boolean', description: '是否异常值', nullable: false },
      batchId: { type: 'string', description: '关联批次ID', nullable: true }
    }
  },
  irrigation_events: {
    description: '灌溉事件表',
    fields: {
      id: { type: 'string', description: '唯一标识', nullable: false },
      valveId: { type: 'string', description: '灌溉阀ID', nullable: false },
      greenhouseId: { type: 'string', description: '温室ID', nullable: false },
      startTime: { type: 'datetime', description: '开始时间', nullable: false },
      endTime: { type: 'datetime', description: '结束时间', nullable: true },
      duration: { type: 'integer', description: '持续时间(秒)', nullable: false },
      waterVolume: { type: 'float', description: '用水量(升)', nullable: false },
      reason: { type: 'string', description: '灌溉原因', nullable: false },
      batchId: { type: 'string', description: '关联批次ID', nullable: true }
    }
  }
};

export const CALIBRATION_CONFIG = {
  temperature: {
    offset: 0,
    slope: 1.0,
    accuracy: 0.5,
    calibrationInterval: 30,
    unit: '°C'
  },
  humidity: {
    offset: 0,
    slope: 1.0,
    accuracy: 2,
    calibrationInterval: 30,
    unit: '%'
  },
  light: {
    offset: 0,
    slope: 1.0,
    accuracy: 5,
    calibrationInterval: 60,
    unit: 'lux'
  },
  soil_moisture: {
    offset: 0,
    slope: 1.0,
    accuracy: 3,
    calibrationInterval: 45,
    unit: '%'
  }
};

export const OUTLIER_DETECTION_CONFIG = {
  iqrMultiplier: 1.5,
  zScoreThreshold: 3,
  minSampleSize: 30,
  rollingWindowSize: 24
};
