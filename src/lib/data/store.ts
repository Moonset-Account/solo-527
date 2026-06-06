import type { SensorReading, Greenhouse, Sensor, IrrigationValve, CropBatch, Alert, FilterState, IrrigationEvent } from '$lib/types';
import { cleanSensorReadings } from './etl';
import { generateGreenhouses, generateSensors, generateValves, generateBatches, generateSensorReadings, generateIrrigationEvents, generateAlerts } from './mockData';
import { applyPermissionFilter, MOCK_USER } from './mockData';

interface CachedData {
  greenhouses: Greenhouse[];
  sensors: Sensor[];
  valves: IrrigationValve[];
  batches: CropBatch[];
  sensorReadings: SensorReading[];
  irrigationEvents: IrrigationEvent[];
  alerts: Alert[];
  lastUpdate: string;
}

let cache: CachedData | null = null;
let cacheExpiry = 300000;
let lastFetchTime = 0;

export async function initializeDatabase(): Promise<void> {
  console.log('初始化数据缓存...');
  await loadAllData();
  console.log('数据缓存初始化完成');
}

async function loadAllData(): Promise<CachedData> {
  const now = Date.now();
  
  if (cache && (now - lastFetchTime) < cacheExpiry) {
    return cache;
  }

  const greenhouses = generateGreenhouses();
  const sensors = generateSensors();
  const valves = generateValves();
  const batches = generateBatches();
  const rawReadings = generateSensorReadings(sensors, 7, batches);
  const irrigationEvents = generateIrrigationEvents(valves, 7);

  const { cleaned: sensorReadings } = cleanSensorReadings(rawReadings, sensors, {
    fillMissing: true,
    detectOutliers: true,
    interpolateMethod: 'linear',
    outlierMethod: 'both'
  });

  const alerts = generateAlerts(sensors, valves, sensorReadings);

  cache = {
    greenhouses: applyPermissionFilter(greenhouses, MOCK_USER) as Greenhouse[],
    sensors: applyPermissionFilter(sensors, MOCK_USER) as Sensor[],
    valves: applyPermissionFilter(valves, MOCK_USER) as IrrigationValve[],
    batches: applyPermissionFilter(batches, MOCK_USER) as CropBatch[],
    sensorReadings: applyPermissionFilter(sensorReadings, MOCK_USER) as SensorReading[],
    irrigationEvents: applyPermissionFilter(irrigationEvents, MOCK_USER) as IrrigationEvent[],
    alerts: applyPermissionFilter(alerts, MOCK_USER) as Alert[],
    lastUpdate: new Date().toISOString()
  };

  lastFetchTime = now;
  return cache as CachedData;
}

export async function getGreenhouses(): Promise<Greenhouse[]> {
  const data = await loadAllData();
  return data.greenhouses;
}

export async function getSensors(): Promise<Sensor[]> {
  const data = await loadAllData();
  return data.sensors;
}

export async function getValves(): Promise<IrrigationValve[]> {
  const data = await loadAllData();
  return data.valves;
}

export async function getBatches(): Promise<CropBatch[]> {
  const data = await loadAllData();
  return data.batches;
}

export async function getAlerts(): Promise<Alert[]> {
  const data = await loadAllData();
  return data.alerts;
}

export async function getSensorReadings(
  filters: Partial<FilterState> = {}
): Promise<{ readings: SensorReading[]; stats: { total: number; missing: number; anomalies: number } }> {
  const data = await loadAllData();
  let readings = [...data.sensorReadings];

  if (filters.greenhouseIds && filters.greenhouseIds.length > 0) {
    readings = readings.filter((r) => filters.greenhouseIds!.includes(r.greenhouseId));
  }

  if (filters.sensorIds && filters.sensorIds.length > 0) {
    readings = readings.filter((r) => filters.sensorIds!.includes(r.sensorId));
  }

  if (filters.sensorTypes && filters.sensorTypes.length > 0) {
    const sensorIdSet = new Set(
      data.sensors.filter((s) => filters.sensorTypes!.includes(s.type)).map((s) => s.id)
    );
    readings = readings.filter((r) => sensorIdSet.has(r.sensorId));
  }

  if (filters.timeRange) {
    const start = new Date(filters.timeRange.start).getTime();
    const end = new Date(filters.timeRange.end).getTime();
    readings = readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= start && t <= end;
    });
  }

  if (!filters.showMissing) {
    readings = readings.filter((r) => !r.isMissing);
  }

  if (!filters.showAnomalies) {
    readings = readings.filter((r) => !r.isOutlier);
  }

  const stats = {
    total: readings.length,
    missing: readings.filter((r) => r.isMissing).length,
    anomalies: readings.filter((r) => r.isOutlier).length
  };

  return { readings, stats };
}

export async function getIrrigationEvents(filters: Partial<FilterState> = {}): Promise<IrrigationEvent[]> {
  const data = await loadAllData();
  let events = [...data.irrigationEvents];

  if (filters.greenhouseIds && filters.greenhouseIds.length > 0) {
    events = events.filter((e) => filters.greenhouseIds!.includes(e.greenhouseId));
  }

  if (filters.timeRange) {
    const start = new Date(filters.timeRange.start).getTime();
    const end = new Date(filters.timeRange.end).getTime();
    events = events.filter((e) => {
      const t = new Date(e.startTime).getTime();
      return t >= start && t <= end;
    });
  }

  return events;
}

export async function getDataUpdateInfo(): Promise<{
  lastUpdateTime: string;
  recordCount: number;
  sensorCount: number;
  missingCount: number;
  anomalyCount: number;
  dataRange: { start: string; end: string };
}> {
  const data = await loadAllData();
  const readings = data.sensorReadings;
  const timestamps = readings.map((r) => new Date(r.timestamp).getTime());

  return {
    lastUpdateTime: data.lastUpdate,
    recordCount: readings.length,
    sensorCount: data.sensors.length,
    missingCount: readings.filter((r) => r.isMissing).length,
    anomalyCount: readings.filter((r) => r.isOutlier).length,
    dataRange: {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString()
    }
  };
}

export async function refreshData(): Promise<void> {
  lastFetchTime = 0;
  await loadAllData();
}

export async function addSensorReadings(newReadings: SensorReading[]): Promise<number> {
  if (!cache) {
    await loadAllData();
  }
  
  const filteredReadings = applyPermissionFilter(newReadings, MOCK_USER) as SensorReading[];
  cache!.sensorReadings = [...cache!.sensorReadings, ...filteredReadings];
  cache!.lastUpdate = new Date().toISOString();
  lastFetchTime = Date.now();
  
  return filteredReadings.length;
}

export async function importSensorData(csvData: string): Promise<{ imported: number; errors: string[] }> {
  console.log('导入传感器数据...');
  return { imported: 0, errors: [] };
}
