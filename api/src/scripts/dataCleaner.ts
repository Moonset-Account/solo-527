import { TEMPERATURE_CONFIG, DATA_QUALITY_CONFIG } from '../config/metricsConfig.js';
import type {
  TemperatureRecord, PositionRecord, DoorRecord,
  DeliveryBatch, AnomalyEvent, DataQualityReport
} from '../../../shared/types';

export interface CleanResult<T> {
  data: T[];
  removed: number;
  issues: string[];
}

export interface CleanStatistics {
  temperatureRecords: CleanResult<TemperatureRecord>;
  positionRecords: CleanResult<PositionRecord>;
  doorRecords: CleanResult<DoorRecord>;
  batches: CleanResult<DeliveryBatch>;
  anomalies: CleanResult<AnomalyEvent>;
  dataQuality: DataQualityReport;
}

const isTimestampValid = (timestamp: string | number): boolean => {
  if (!timestamp) return false;
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return !isNaN(time) && time > 0 && time < Date.now() + 86400000;
};

const isTemperatureValid = (temp: number): boolean => {
  if (temp === null || temp === undefined || isNaN(temp)) return false;
  return temp >= -50 && temp <= 100;
};

const isCoordinateValid = (lat: number, lng: number): boolean => {
  if (lat === null || lat === undefined || isNaN(lat)) return false;
  if (lng === null || lng === undefined || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const cleanTemperatureRecords = (records: any[]): CleanResult<TemperatureRecord> => {
  const issues: string[] = [];
  const validData: TemperatureRecord[] = [];
  let removed = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const recordIssues: string[] = [];

    if (!r.id) recordIssues.push('missing id');
    if (!r.vehicle_id && !r.vehicleId) recordIssues.push('missing vehicle_id');
    if (!r.batch_id && !r.batchId) recordIssues.push('missing batch_id');
    if (!r.probe_id && !r.probeId) recordIssues.push('missing probe_id');
    if (!isTimestampValid(r.timestamp)) recordIssues.push('invalid timestamp');
    if (!isTemperatureValid(r.temperature)) recordIssues.push('invalid temperature');

    if (recordIssues.length > 0) {
      removed++;
      if (removed <= 10) {
        issues.push(`记录 ${r.id || i}: ${recordIssues.join(', ')}`);
      }
      continue;
    }

    const temp = Number(r.temperature);
    validData.push({
      id: String(r.id),
      vehicleId: String(r.vehicle_id || r.vehicleId),
      batchId: String(r.batch_id || r.batchId),
      probeId: String(r.probe_id || r.probeId),
      timestamp: typeof r.timestamp === 'string' ? new Date(r.timestamp).getTime() : Number(r.timestamp),
      temperature: Math.round(temp * 100) / 100,
      isNormal: temp >= TEMPERATURE_CONFIG.min && temp <= TEMPERATURE_CONFIG.max,
    });
  }

  if (removed > 10) {
    issues.push(`... 另外 ${removed - 10} 条记录存在问题`);
  }

  return { data: validData, removed, issues };
};

export const cleanPositionRecords = (records: any[]): CleanResult<PositionRecord> => {
  const issues: string[] = [];
  const validData: PositionRecord[] = [];
  let removed = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const recordIssues: string[] = [];

    if (!r.id) recordIssues.push('missing id');
    if (!r.vehicle_id && !r.vehicleId) recordIssues.push('missing vehicle_id');
    if (!isTimestampValid(r.timestamp)) recordIssues.push('invalid timestamp');
    if (!isCoordinateValid(r.lat, r.lng)) recordIssues.push('invalid coordinates');

    if (recordIssues.length > 0) {
      removed++;
      if (removed <= 10) {
        issues.push(`记录 ${r.id || i}: ${recordIssues.join(', ')}`);
      }
      continue;
    }

    validData.push({
      id: String(r.id),
      vehicleId: String(r.vehicle_id || r.vehicleId),
      timestamp: typeof r.timestamp === 'string' ? new Date(r.timestamp).getTime() : Number(r.timestamp),
      lat: Number(r.lat),
      lng: Number(r.lng),
      speed: r.speed ? Math.round(Number(r.speed) * 10) / 10 : 0,
    });
  }

  if (removed > 10) {
    issues.push(`... 另外 ${removed - 10} 条记录存在问题`);
  }

  return { data: validData, removed, issues };
};

export const cleanDoorRecords = (records: any[]): CleanResult<DoorRecord> => {
  const issues: string[] = [];
  const validData: DoorRecord[] = [];
  let removed = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const recordIssues: string[] = [];

    if (!r.id) recordIssues.push('missing id');
    if (!r.vehicle_id && !r.vehicleId) recordIssues.push('missing vehicle_id');
    if (!isTimestampValid(r.open_time || r.openTime)) recordIssues.push('invalid open_time');

    if (recordIssues.length > 0) {
      removed++;
      if (removed <= 10) {
        issues.push(`记录 ${r.id || i}: ${recordIssues.join(', ')}`);
      }
      continue;
    }

    const openTime = typeof (r.open_time || r.openTime) === 'string'
      ? new Date(r.open_time || r.openTime).getTime()
      : Number(r.open_time || r.openTime);
    
    const closeTime = r.close_time || r.closeTime
      ? (typeof (r.close_time || r.closeTime) === 'string'
        ? new Date(r.close_time || r.closeTime).getTime()
        : Number(r.close_time || r.closeTime))
      : 0;

    validData.push({
      id: String(r.id),
      vehicleId: String(r.vehicle_id || r.vehicleId),
      batchId: r.batch_id || r.batchId ? String(r.batch_id || r.batchId) : '',
      openTime,
      closeTime,
      duration: r.duration_seconds || r.duration ? Number(r.duration_seconds || r.duration) : Math.max(0, (closeTime - openTime) / 1000),
      operator: r.operator || '',
    });
  }

  if (removed > 10) {
    issues.push(`... 另外 ${removed - 10} 条记录存在问题`);
  }

  return { data: validData, removed, issues };
};

export const calculateDataQuality = (
  tempResult: CleanResult<TemperatureRecord>,
  posResult: CleanResult<PositionRecord>,
  doorResult: CleanResult<DoorRecord>
): DataQualityReport => {
  const totalRecords = tempResult.data.length + posResult.data.length + doorResult.data.length;
  const totalRemoved = tempResult.removed + posResult.removed + doorResult.removed;
  const totalProcessed = totalRecords + totalRemoved;
  
  const completeness = totalProcessed > 0
    ? Math.round((totalRecords / totalProcessed) * 1000) / 10
    : 100;

  const missingFields = [
    { field: 'temperature_records', missingCount: tempResult.removed },
    { field: 'position_records', missingCount: posResult.removed },
    { field: 'door_records', missingCount: doorResult.removed },
  ].filter(m => m.missingCount > 0);

  const anomalyPoints = tempResult.data.filter(t => !t.isNormal).length;

  const sampleSize = [
    { dimension: 'temperature_records', count: tempResult.data.length },
    { dimension: 'position_records', count: posResult.data.length },
    { dimension: 'door_records', count: doorResult.data.length },
  ];

  const issues = [...tempResult.issues, ...posResult.issues, ...doorResult.issues];

  return {
    updateTime: Date.now(),
    completeness,
    missingFields,
    anomalyPoints,
    sampleSize,
    isUpdateFailed: completeness < DATA_QUALITY_CONFIG.completenessThreshold,
    errorMessage: issues.length > 0 ? issues.slice(0, 5).join('; ') : undefined,
  };
};

export const runCleaningPipeline = async (
  rawTemp: any[],
  rawPos: any[],
  rawDoor: any[]
): Promise<CleanStatistics> => {
  const tempResult = cleanTemperatureRecords(rawTemp);
  const posResult = cleanPositionRecords(rawPos);
  const doorResult = cleanDoorRecords(rawDoor);

  const dataQuality = calculateDataQuality(tempResult, posResult, doorResult);

  return {
    temperatureRecords: tempResult,
    positionRecords: posResult,
    doorRecords: doorResult,
    batches: { data: [], removed: 0, issues: [] },
    anomalies: { data: [], removed: 0, issues: [] },
    dataQuality,
  };
};

export default runCleaningPipeline;
