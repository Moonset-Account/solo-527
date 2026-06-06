import type { SensorReading, Sensor } from '$lib/types';
import { CALIBRATION_CONFIG, METRIC_CONFIGS } from './dictionary';

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'range' | 'threshold' | 'calibration' | 'consistency' | 'gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sensorId?: string;
  timestamp?: string;
  value?: number;
  expected?: { min: number; max: number };
}

export function validateSensorData(
  readings: SensorReading[],
  sensors: Sensor[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const sensorMap = new Map(sensors.map((s) => [s.id, s]));

  const groupedBySensor: Record<string, SensorReading[]> = {};
  readings.forEach((r) => {
    if (!groupedBySensor[r.sensorId]) groupedBySensor[r.sensorId] = [];
    groupedBySensor[r.sensorId].push(r);
  });

  for (const [sensorId, sensorReadings] of Object.entries(groupedBySensor)) {
    const sensor = sensorMap.get(sensorId);
    if (!sensor) continue;

    const rangeIssues = validateValueRange(sensorReadings, sensor);
    const gapIssues = validateTimeGaps(sensorReadings, sensor);
    const consistencyIssues = validateConsistency(sensorReadings, sensor);

    issues.push(...rangeIssues, ...gapIssues, ...consistencyIssues);
  }

  return {
    valid: issues.length === 0,
    issues: issues.sort(
      (a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity)
    )
  };
}

function validateValueRange(
  readings: SensorReading[],
  sensor: Sensor
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const config = METRIC_CONFIGS.find((m) => m.key === sensor.type);

  readings.forEach((reading) => {
    if (reading.isMissing || isNaN(reading.value)) return;

    if (reading.value < config!.min || reading.value > config!.max) {
      issues.push({
        type: 'range',
        severity: 'high',
        message: `${sensor.name} 数值超出物理范围: ${reading.value}${sensor.unit}`,
        sensorId: sensor.id,
        timestamp: reading.timestamp,
        value: reading.value,
        expected: { min: config!.min, max: config!.max }
      });
    }

    if (reading.value < sensor.thresholdMin || reading.value > sensor.thresholdMax) {
      issues.push({
        type: 'threshold',
        severity: 'medium',
        message: `${sensor.name} 超出设定阈值: ${reading.value}${sensor.unit}`,
        sensorId: sensor.id,
        timestamp: reading.timestamp,
        value: reading.value,
        expected: { min: sensor.thresholdMin, max: sensor.thresholdMax }
      });
    }
  });

  return issues;
}

function validateTimeGaps(
  readings: SensorReading[],
  sensor: Sensor
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const intervalMs = sensor.samplingInterval * 1000;
  const maxGap = intervalMs * 3;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].timestamp).getTime();
    const curr = new Date(sorted[i].timestamp).getTime();
    const gap = curr - prev;

    if (gap > maxGap) {
      issues.push({
        type: 'gap',
        severity: 'medium',
        message: `${sensor.name} 数据采集中断: 间隔 ${Math.round(gap / 60000)} 分钟`,
        sensorId: sensor.id,
        timestamp: sorted[i].timestamp
      });
    }
  }

  return issues;
}

function validateConsistency(
  readings: SensorReading[],
  sensor: Sensor
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validValues = readings.filter((r) => !r.isMissing && !isNaN(r.value));

  if (validValues.length < 10) return issues;

  const values = validValues.map((r) => r.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

  const cv = std / mean;
  const calibration = CALIBRATION_CONFIG[sensor.type];

  if (cv > 0.5) {
    issues.push({
      type: 'consistency',
      severity: 'high',
      message: `${sensor.name} 数据波动异常，变异系数: ${(cv * 100).toFixed(1)}%`,
      sensorId: sensor.id
    });
  }

  if (calibration && Math.abs(mean - calibration.offset) > calibration.accuracy * 10) {
    issues.push({
      type: 'calibration',
      severity: 'medium',
      message: `${sensor.name} 可能需要校准，均值偏离基准`,
      sensorId: sensor.id
    });
  }

  return issues;
}

function getSeverityWeight(severity: string): number {
  const weights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  return weights[severity] || 0;
}

export function drilldownAnalysis(
  readings: SensorReading[],
  sensorId: string,
  startTime: string,
  endTime: string
) {
  const filtered = readings.filter(
    (r) =>
      r.sensorId === sensorId &&
      new Date(r.timestamp) >= new Date(startTime) &&
      new Date(r.timestamp) <= new Date(endTime)
  );

  const values = filtered.filter((r) => !r.isMissing && !isNaN(r.value)).map((r) => r.value);

  if (values.length === 0) {
    return null;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  const anomalies = filtered.filter((r) => {
    if (r.isMissing || isNaN(r.value)) return false;
    return r.value < q1 - 1.5 * iqr || r.value > q3 + 1.5 * iqr;
  });

  const hourly: Record<string, number[]> = {};
  filtered.forEach((r) => {
    if (r.isMissing || isNaN(r.value)) return;
    const hour = r.timestamp.substring(0, 13) + ':00:00';
    if (!hourly[hour]) hourly[hour] = [];
    hourly[hour].push(r.value);
  });

  const hourlyStats = Object.entries(hourly).map(([hour, vals]) => ({
    hour,
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length
  }));

  return {
    summary: {
      count: values.length,
      mean,
      median,
      std,
      min,
      max,
      q1,
      q3,
      iqr,
      cv: std / mean
    },
    anomalies,
    hourlyStats
  };
}

export function generateCalibrationReport(sensors: Sensor[]) {
  return sensors.map((sensor) => {
    const config = CALIBRATION_CONFIG[sensor.type];
    return {
      sensorId: sensor.id,
      sensorName: sensor.name,
      type: sensor.type,
      lastCalibration: sensor.installedAt,
      calibrationInterval: config?.calibrationInterval || 30,
      dueForCalibration: false,
      accuracy: config?.accuracy,
      unit: sensor.unit
    };
  });
}
