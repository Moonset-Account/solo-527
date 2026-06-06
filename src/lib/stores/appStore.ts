import { writable, derived } from 'svelte/store';
import type { FilterState, Greenhouse, Sensor, DataUpdateInfo, SensorReading, Alert, IrrigationValve, CropBatch, IrrigationEvent, SensorType, DeviceStatus } from '$lib/types';
import dayjs from 'dayjs';

function createFilterStore() {
  const initial: FilterState = {
    greenhouseIds: [],
    sensorIds: [],
    cropTypes: [],
    timeRange: {
      start: dayjs().subtract(7, 'day').startOf('day').toISOString(),
      end: dayjs().endOf('day').toISOString()
    },
    deviceStatuses: [],
    sensorTypes: [],
    batchIds: [],
    showAnomalies: true,
    showMissing: true
  };

  const { subscribe, set, update } = writable<FilterState>(initial);

  return {
    subscribe,
    setGreenhouses: (ids: string[]) => update((s) => ({ ...s, greenhouseIds: ids })),
    setSensors: (ids: string[]) => update((s) => ({ ...s, sensorIds: ids })),
    setSensorTypes: (types: string[]) => update((s) => ({ ...s, sensorTypes: types as SensorType[] })),
    setTimeRange: (start: string, end: string) => update((s) => ({ ...s, timeRange: { start, end } })),
    setDeviceStatuses: (statuses: string[]) => update((s) => ({ ...s, deviceStatuses: statuses as DeviceStatus[] })),
    setBatchIds: (ids: string[]) => update((s) => ({ ...s, batchIds: ids })),
    toggleShowAnomalies: () => update((s) => ({ ...s, showAnomalies: !s.showAnomalies })),
    toggleShowMissing: () => update((s) => ({ ...s, showMissing: !s.showMissing })),
    reset: () => set(initial),
    set
  };
}

export const filters = createFilterStore();

export const greenhouses = writable<Greenhouse[]>([]);
export const sensors = writable<Sensor[]>([]);
export const valves = writable<IrrigationValve[]>([]);
export const batches = writable<CropBatch[]>([]);
export const sensorReadings = writable<SensorReading[]>([]);
export const irrigationEvents = writable<IrrigationEvent[]>([]);
export const alerts = writable<Alert[]>([]);
export const dataUpdateInfo = writable<DataUpdateInfo | null>(null);
export const loading = writable(false);
export const selectedSensor = writable<Sensor | null>(null);
export const drilldownData = writable<any>(null);

export const filteredSensors = derived(
  [sensors, filters],
  ([$sensors, $filters]) => {
    let result = [...$sensors];
    if ($filters.greenhouseIds.length > 0) {
      result = result.filter((s) => $filters.greenhouseIds.includes(s.greenhouseId));
    }
    if ($filters.deviceStatuses.length > 0) {
      result = result.filter((s) => $filters.deviceStatuses.includes(s.status));
    }
    if ($filters.sensorTypes.length > 0) {
      result = result.filter((s) => $filters.sensorTypes.includes(s.type));
    }
    return result;
  }
);

export const activeAlerts = derived(alerts, ($alerts) => $alerts.filter((a) => !a.resolved));

export const offlineSensors = derived(sensors, ($sensors) => $sensors.filter((s) => s.status === 'offline'));

export const readingStats = derived(sensorReadings, ($readings) => {
  return {
    total: $readings.length,
    missing: $readings.filter((r) => r.isMissing).length,
    anomalies: $readings.filter((r) => r.isOutlier).length,
    valid: $readings.filter((r) => !r.isMissing && !r.isOutlier).length
  };
});
