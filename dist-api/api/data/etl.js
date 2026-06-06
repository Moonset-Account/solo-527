import { mockStations, mockTrips, mockDispatches, mockAlerts, mockMetricConfig } from './mockData';
let dataStore = null;
let etlStatuses = [];
let metricConfig = JSON.parse(JSON.stringify(mockMetricConfig));
let lastUpdateTime = Date.now();
let etlWarnings = [];
function toColumnStore(items) {
    if (items.length === 0)
        return {};
    const columns = {};
    for (const key of Object.keys(items[0])) {
        columns[key] = items.map(item => item[key]);
    }
    return columns;
}
function validateTrips(trips) {
    const requiredFields = ['startStationId', 'endStationId', 'startTime', 'bikeId'];
    const missingFields = [];
    const valid = [];
    for (const trip of trips) {
        const tripMissing = [];
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
        }
        else {
            missingFields.push(...tripMissing.filter(f => !missingFields.includes(f)));
        }
    }
    return { valid, missingFields };
}
function validateStations(stations) {
    const requiredFields = ['availableBikes', 'capacity', 'lastUpdate'];
    const missingFields = [];
    const valid = [];
    for (const station of stations) {
        const stationMissing = [];
        for (const field of requiredFields) {
            if (station[field] === undefined || station[field] === null) {
                stationMissing.push(field);
            }
        }
        if (stationMissing.length === 0) {
            valid.push(station);
        }
        else {
            missingFields.push(...stationMissing.filter(f => !missingFields.includes(f)));
        }
    }
    return { valid, missingFields };
}
export async function runETL() {
    etlWarnings = [];
    const statuses = [];
    statuses.push({
        source: 'stations',
        lastUpdate: Date.now(),
        status: 'running',
        recordCount: 0,
        missingFields: [],
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    const stationValidation = validateStations(mockStations);
    const stationStatus = {
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
    const tripStatus = {
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
export function getEtlStatuses() {
    return etlStatuses;
}
export function getEtlWarnings() {
    return etlWarnings;
}
export function getLastUpdateTime() {
    return lastUpdateTime;
}
export function getDataVersion() {
    return `v1.0.${Math.floor(lastUpdateTime / 1000)}`;
}
export function getMetricConfig() {
    return metricConfig;
}
export function updateMetricConfig(config) {
    metricConfig = { ...metricConfig, ...config };
    return metricConfig;
}
export function getDataStore() {
    if (!dataStore) {
        throw new Error('ETL尚未运行，请先调用runETL()');
    }
    return dataStore;
}
export function calculateAvailableInventory() {
    const store = getDataStore();
    let total = 0;
    let maintenance = 0;
    for (let i = 0; i < store.stationIds.length; i++) {
        total += (store.stations.availableBikes[i] || 0) + (store.stations.maintenanceBikes[i] || 0);
        maintenance += store.stations.maintenanceBikes[i] || 0;
    }
    return total - maintenance;
}
export function filterTripsByTimeRange(startTime, endTime) {
    const store = getDataStore();
    const indices = [];
    for (let i = 0; i < store.tripIds.length; i++) {
        const t = store.trips.startTime[i];
        if (t >= startTime && t <= endTime) {
            indices.push(i);
        }
    }
    return indices;
}
runETL().catch(console.error);
