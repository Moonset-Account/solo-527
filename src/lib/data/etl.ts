import type { SensorReading, Sensor, SensorType, DataQuality } from '$lib/types';
import { OUTLIER_DETECTION_CONFIG } from './dictionary';
import dayjs from 'dayjs';

export interface ETLOptions {
  fillMissing: boolean;
  detectOutliers: boolean;
  markMissing?: boolean;
  interpolateMethod: 'linear' | 'forward' | 'mean';
  outlierMethod: 'iqr' | 'zscore' | 'both';
}

const DEFAULT_ETL_OPTIONS: ETLOptions = {
  fillMissing: true,
  detectOutliers: true,
  markMissing: true,
  interpolateMethod: 'linear',
  outlierMethod: 'both'
};

export function cleanSensorReadings(
  readings: SensorReading[],
  sensors: Sensor[],
  options: Partial<ETLOptions> = {}
): {
  cleaned: SensorReading[];
  stats: {
    total: number;
    missing: number;
    outliers: number;
    filled: number;
    anomalies: number;
  };
} {
  const opts = { ...DEFAULT_ETL_OPTIONS, ...options };
  let stats = { total: readings.length, missing: 0, outliers: 0, filled: 0, anomalies: 0 };

  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const groupedBySensor = groupBy(readings, 'sensorId');

  const cleaned: SensorReading[] = [];

  for (const [sensorId, sensorReadings] of Object.entries(groupedBySensor)) {
    const sensor = sensorMap.get(sensorId);
    if (!sensor) continue;

    let processed = markMissing(sensorReadings, sensor);
    stats.missing += processed.filter((r) => r.isMissing).length;

    if (opts.detectOutliers) {
      processed = detectOutliers(processed, sensor, opts.outlierMethod);
      stats.outliers += processed.filter((r) => r.isOutlier).length;
    }

    if (opts.fillMissing && opts.interpolateMethod) {
      const result = interpolateMissing(processed, opts.interpolateMethod, sensor);
      processed = result.readings;
      stats.filled += result.filledCount;
    }

    processed = updateDataQuality(processed);
    stats.anomalies += processed.filter((r) => r.quality === 'anomaly').length;

    cleaned.push(...processed);
  }

  return { cleaned, stats };
}

function groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function markMissing(readings: SensorReading[], sensor: Sensor): SensorReading[] {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const marked: SensorReading[] = [];
  const intervalMs = sensor.samplingInterval * 1000;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    marked.push(current);

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const gap = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();

      if (gap > intervalMs * 2) {
        const expectedPoints = Math.floor(gap / intervalMs) - 1;
        for (let j = 1; j <= expectedPoints; j++) {
          const missingTime = new Date(
            new Date(current.timestamp).getTime() + j * intervalMs
          ).toISOString();
          marked.push({
            id: `missing-${sensor.id}-${missingTime}`,
            sensorId: sensor.id,
            greenhouseId: sensor.greenhouseId,
            timestamp: missingTime,
            value: NaN,
            quality: 'missing',
            isMissing: true,
            isOutlier: false
          });
        }
      }
    }
  }

  return marked;
}

function detectOutliers(
  readings: SensorReading[],
  sensor: Sensor,
  method: 'iqr' | 'zscore' | 'both'
): SensorReading[] {
  const validValues = readings.filter((r) => !r.isMissing && !isNaN(r.value));
  const values = validValues.map((r) => r.value);

  if (values.length < OUTLIER_DETECTION_CONFIG.minSampleSize) {
    return readings;
  }

  let outlierIndices: Set<number> = new Set();

  if (method === 'iqr' || method === 'both') {
    outlierIndices = new Set([...outlierIndices, ...detectOutliersIQR(values)]);
  }

  if (method === 'zscore' || method === 'both') {
    outlierIndices = new Set([...outlierIndices, ...detectOutliersZScore(values)]);
  }

  return readings.map((reading, idx) => {
    const validIdx = validValues.findIndex((v) => v.id === reading.id);
    if (validIdx >= 0 && outlierIndices.has(validIdx)) {
      return { ...reading, isOutlier: true };
    }
    return reading;
  });
}

function detectOutliersIQR(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - OUTLIER_DETECTION_CONFIG.iqrMultiplier * iqr;
  const upperBound = q3 + OUTLIER_DETECTION_CONFIG.iqrMultiplier * iqr;

  return values
    .map((v, i) => (v < lowerBound || v > upperBound ? i : -1))
    .filter((i) => i >= 0);
}

function detectOutliersZScore(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  const threshold = OUTLIER_DETECTION_CONFIG.zScoreThreshold;

  return values
    .map((v, i) => (Math.abs((v - mean) / std) > threshold ? i : -1))
    .filter((i) => i >= 0);
}

function interpolateMissing(
  readings: SensorReading[],
  method: 'linear' | 'forward' | 'mean',
  sensor: Sensor
): { readings: SensorReading[]; filledCount: number } {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let filledCount = 0;
  const result = sorted.map((reading, idx) => {
    if (!reading.isMissing) return reading;

    let filledValue: number | null = null;

    if (method === 'forward') {
      const prevValid = findPrevValid(sorted, idx);
      if (prevValid) filledValue = prevValid.value;
    } else if (method === 'mean') {
      const prevValid = findPrevValid(sorted, idx);
      const nextValid = findNextValid(sorted, idx);
      if (prevValid && nextValid) {
        filledValue = (prevValid.value + nextValid.value) / 2;
      } else if (prevValid) {
        filledValue = prevValid.value;
      } else if (nextValid) {
        filledValue = nextValid.value;
      }
    } else if (method === 'linear') {
      const prevValid = findPrevValid(sorted, idx);
      const nextValid = findNextValid(sorted, idx);
      if (prevValid && nextValid) {
        const prevTime = new Date(prevValid.timestamp).getTime();
        const nextTime = new Date(nextValid.timestamp).getTime();
        const currTime = new Date(reading.timestamp).getTime();
        const ratio = (currTime - prevTime) / (nextTime - prevTime);
        filledValue = prevValid.value + ratio * (nextValid.value - prevValid.value);
      } else if (prevValid) {
        filledValue = prevValid.value;
      } else if (nextValid) {
        filledValue = nextValid.value;
      }
    }

    if (filledValue !== null && !isNaN(filledValue)) {
      filledCount++;
      return {
        ...reading,
        value: filledValue,
        quality: (reading.isOutlier ? 'outlier' : 'good') as DataQuality
      };
    }

    return reading;
  });

  return { readings: result, filledCount };
}

function findPrevValid(readings: SensorReading[], idx: number): SensorReading | null {
  for (let i = idx - 1; i >= 0; i--) {
    if (!readings[i].isMissing && !isNaN(readings[i].value)) {
      return readings[i];
    }
  }
  return null;
}

function findNextValid(readings: SensorReading[], idx: number): SensorReading | null {
  for (let i = idx + 1; i < readings.length; i++) {
    if (!readings[i].isMissing && !isNaN(readings[i].value)) {
      return readings[i];
    }
  }
  return null;
}

function updateDataQuality(readings: SensorReading[]): SensorReading[] {
  return readings.map((r) => {
    if (r.isMissing && isNaN(r.value)) {
      return { ...r, quality: 'missing' };
    }
    if (r.isOutlier) {
      return { ...r, quality: 'outlier' };
    }
    return { ...r, quality: 'good' };
  });
}

export function checkSensorOffline(sensors: Sensor[], thresholdMinutes: number = 30): Sensor[] {
  const now = dayjs();
  return sensors.filter((sensor) => {
    const lastSeen = dayjs(sensor.lastSeen);
    return now.diff(lastSeen, 'minute') > thresholdMinutes;
  });
}

export function validateReadingAgainstThreshold(
  reading: SensorReading,
  sensor: Sensor
): { valid: boolean; message?: string } {
  if (reading.isMissing) {
    return { valid: false, message: '数据缺失' };
  }

  if (reading.value < sensor.thresholdMin) {
    return { valid: false, message: `低于阈值 ${sensor.thresholdMin}${sensor.unit}` };
  }

  if (reading.value > sensor.thresholdMax) {
    return { valid: false, message: `高于阈值 ${sensor.thresholdMax}${sensor.unit}` };
  }

  return { valid: true };
}
