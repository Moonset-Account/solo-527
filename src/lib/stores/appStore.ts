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

export const offlineSensors = derived(sensors, ($sensors) => $sensors.filter((s) => s.status === 'offline'));

export const filteredReadings = derived(
  [sensorReadings, filteredSensors, filters],
  ([$sensorReadings, $filteredSensors, $filters]) => {
    const sensorIds = new Set($filteredSensors.map((s) => s.id));
    let result = $sensorReadings.filter((r) => sensorIds.has(r.sensorId));

    if ($filters.timeRange) {
      const start = new Date($filters.timeRange.start).getTime();
      const end = new Date($filters.timeRange.end).getTime();
      result = result.filter((r) => {
        const t = new Date(r.timestamp).getTime();
        return t >= start && t <= end;
      });
    }

    if (!$filters.showMissing) {
      result = result.filter((r) => !r.isMissing);
    }
    if (!$filters.showAnomalies) {
      result = result.filter((r) => !r.isOutlier);
    }

    return result;
  }
);

export const filteredAlerts = derived(
  [alerts, filteredSensors, filters],
  ([$alerts, $filteredSensors, $filters]) => {
    const sensorIds = new Set($filteredSensors.map((s) => s.id));
    let result = $alerts.filter((a) => a.sensorId && sensorIds.has(a.sensorId));

    if ($filters.timeRange) {
      const start = new Date($filters.timeRange.start).getTime();
      const end = new Date($filters.timeRange.end).getTime();
      result = result.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= start && t <= end;
      });
    }

    return result;
  }
);

export const filteredIrrigationEvents = derived(
  [irrigationEvents, filters],
  ([$irrigationEvents, $filters]) => {
    let result = [...$irrigationEvents];

    if ($filters.greenhouseIds.length > 0) {
      result = result.filter((e) => $filters.greenhouseIds.includes(e.greenhouseId));
    }

    if ($filters.timeRange) {
      const start = new Date($filters.timeRange.start).getTime();
      const end = new Date($filters.timeRange.end).getTime();
      result = result.filter((e) => {
        const t = new Date(e.startTime).getTime();
        return t >= start && t <= end;
      });
    }

    if ($filters.batchIds.length > 0) {
      result = result.filter((e) => e.batchId && $filters.batchIds.includes(e.batchId));
    }

    return result;
  }
);

export const filteredValves = derived(
  [valves, filters],
  ([$valves, $filters]) => {
    let result = [...$valves];

    if ($filters.greenhouseIds.length > 0) {
      result = result.filter((v) => $filters.greenhouseIds.includes(v.greenhouseId));
    }

    if ($filters.deviceStatuses.length > 0) {
      result = result.filter((v) => $filters.deviceStatuses.includes(v.status as any));
    }

    return result;
  }
);

export const activeAlerts = derived(filteredAlerts, ($alerts) => $alerts.filter((a) => !a.resolved));

export const readingStats = derived(filteredReadings, ($readings) => {
  return {
    total: $readings.length,
    missing: $readings.filter((r) => r.isMissing).length,
    anomalies: $readings.filter((r) => r.isOutlier).length,
    valid: $readings.filter((r) => !r.isMissing && !r.isOutlier).length
  };
});
