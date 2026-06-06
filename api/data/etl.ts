import type { EtlStatus, TripRecord, Station, MetricConfig } from '@shared/types';
import { mockStations, mockTrips, mockDispatches, mockAlerts, mockMetricConfig } from './mockData';

interface ColumnStore<T> {
  [K in keyof T]: T[K][];
}

interface DataStore {
  stations: ColumnStore<Station>;
  trips: ColumnStore<TripRecord>;
  stationIds: string[];
  tripIds: string[];
}

let dataStore: DataStore | null = null;
let etlStatuses: EtlStatus[] = [];
let metricConfig: MetricConfig = JSON.parse(JSON.stringify(mockMetricConfig));
let lastUpdateTime = Date.now();
let etlWarnings: string[] = [];

function toColumnStore<T extends Record<string, any>>(items: T[]): ColumnStore<T> {
  if (items.length === 0) return {} as ColumnStore<T>;
  const columns = {} as ColumnStore<T>;
  for (const key of Object.keys(items[0]) as (keyof T)[]) {
    columns[key] = items.map(item => item[key]);
  }
  return columns;
}

function validateTrips(trips: TripRecord[]): { valid: TripRecord[]; missingFields: string[] } {
  const requiredFields: (keyof TripRecord)[] = ['startStationId', 'endStationId', 'startTime', 'bikeId'];
  const missingFields: string[] = [];
  const valid: TripRecord[] = [];

  for (const trip of trips) {
    const tripMissing: string[] = [];
    for (const field of requiredFields) {
      if (trip[field] === undefined || trip[field] === null || trip[field] === '') {
        tripMissing.push(field);
      }
    }
    if (tripMissing.length === 0) {
      if (trip.duration > 4 * 3600) {
        etlWarnings.push(`行程 ${trip.id} 时长超过4小时，标记为异常`);
      }
      valid.push(trip);
    } else {
      missingFields.push(...tripMissing.filter(f => !missingFields.includes(f)));
    }
  }
  return { valid, missingFields };
}

function validateStations(stations: Station[]): { valid: Station[]; missingFields: string[] } {
  const requiredFields: (keyof Station)[] = ['availableBikes', 'capacity', 'lastUpdate'];
  const missingFields: string[] = [];
  const valid: Station[] = [];

  for (const station of stations) {
    const stationMissing: string[] = [];
    for (const field of requiredFields) {
      if (station[field] === undefined || station[field] === null) {
        stationMissing.push(field);
      }
    }
    if (stationMissing.length === 0) {
      valid.push(station);
    } else {
      missingFields.push(...stationMissing.filter(f => !missingFields.includes(f)));
    }
  }
  return { valid, missingFields };
}

export async function runETL(): Promise<EtlStatus[]> {
  etlWarnings = [];
  const statuses: EtlStatus[] = [];

  statuses.push({
    source: 'stations',
    lastUpdate: Date.now(),
    status: 'running',
    recordCount: 0,
    missingFields: [],
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const stationValidation = validateStations(mockStations);
  const stationStatus: EtlStatus = {
    source: 'stations',
    lastUpdate: Date.now(),
    status: 'success',
    recordCount: stationValidation.valid.length,
    missingFields: stationValidation.missingFields,
  };
  if (stationValidation.missingFields.length > 0) {
    stationStatus.errorMessage = `部分站点数据字段缺失: ${stationValidation.missingFields.join(', ')}`;
    etlWarnings.push(stationStatus.errorMessage);
  }
  statuses[0] = stationStatus;

  statuses.push({
    source: 'trips',
    lastUpdate: Date.now(),
    status: 'running',
    recordCount: 0,
    missingFields: [],
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  const tripValidation = validateTrips(mockTrips);
  const tripStatus: EtlStatus = {
    source: 'trips',
    lastUpdate: Date.now(),
    status: 'success',
    recordCount: tripValidation.valid.length,
    missingFields: tripValidation.missingFields,
  };
  if (tripValidation.missingFields.length > 0) {
    tripStatus.errorMessage = `部分行程数据字段缺失: ${tripValidation.missingFields.join(', ')}`;
    etlWarnings.push(tripStatus.errorMessage);
  }
  statuses[1] = tripStatus;

  statuses.push({
    source: 'dispatches',
    lastUpdate: Date.now(),
    status: 'success',
    recordCount: mockDispatches.length,
    missingFields: [],
  });

  statuses.push({
    source: 'alerts',
    lastUpdate: Date.now(),
    status: 'success',
    recordCount: mockAlerts.length,
    missingFields: [],
  });

  dataStore = {
    stations: toColumnStore(stationValidation.valid),
    trips: toColumnStore(tripValidation.valid),
    stationIds: stationValidation.valid.map(s => s.id),
    tripIds: tripValidation.valid.map(t => t.id),
  };

  lastUpdateTime = Date.now();
  etlStatuses = statuses;

  return statuses;
}

export function getEtlStatuses(): EtlStatus[] {
  return etlStatuses;
}

export function getEtlWarnings(): string[] {
  return etlWarnings;
}

export function getLastUpdateTime(): number {
  return lastUpdateTime;
}

export function getDataVersion(): string {
  return `v1.0.${Math.floor(lastUpdateTime / 1000)}`;
}

export function getMetricConfig(): MetricConfig {
  return metricConfig;
}

export function updateMetricConfig(config: Partial<MetricConfig>): MetricConfig {
  metricConfig = { ...metricConfig, ...config };
  return metricConfig;
}

export function getDataStore(): DataStore {
  if (!dataStore) {
    throw new Error('ETL尚未运行，请先调用runETL()');
  }
  return dataStore;
}

export function calculateAvailableInventory(): number {
  const store = getDataStore();
  let total = 0;
  let maintenance = 0;
  for (let i = 0; i < store.stationIds.length; i++) {
    total += (store.stations.availableBikes[i] || 0) + (store.stations.maintenanceBikes[i] || 0);
    maintenance += store.stations.maintenanceBikes[i] || 0;
  }
  return total - maintenance;
}

export function filterTripsByTimeRange(startTime: number, endTime: number): number[] {
  const store = getDataStore();
  const indices: number[] = [];
  for (let i = 0; i < store.tripIds.length; i++) {
    const t = store.trips.startTime[i];
    if (t >= startTime && t <= endTime) {
      indices.push(i);
    }
  }
  return indices;
}

runETL().catch(console.error);
