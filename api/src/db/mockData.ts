import { randomUUID } from 'crypto';
import type {
  Vehicle, Route, Customer, DeliveryBatch, TemperatureProbe,
  TemperatureRecord, PositionRecord, DoorRecord, AnomalyEvent,
  SavedFilter, DataQualityLog
} from '../../../shared/types';

const generateId = () => randomUUID();
const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const vehicles: Vehicle[] = [
  { id: generateId(), plateNumber: '沪A12345', driverName: '张师傅', status: 'running' },
  { id: generateId(), plateNumber: '沪B67890', driverName: '李师傅', status: 'running' },
  { id: generateId(), plateNumber: '沪C11111', driverName: '王师傅', status: 'idle' },
  { id: generateId(), plateNumber: '沪D22222', driverName: '赵师傅', status: 'running' },
  { id: generateId(), plateNumber: '沪E33333', driverName: '刘师傅', status: 'maintenance' },
];

export const routes: Route[] = [
  { id: generateId(), name: '上海-北京线', origin: '上海', destination: '北京', distanceKm: 1200 },
  { id: generateId(), name: '上海-广州线', origin: '上海', destination: '广州', distanceKm: 1500 },
  { id: generateId(), name: '上海-深圳线', origin: '上海', destination: '深圳', distanceKm: 1450 },
  { id: generateId(), name: '上海-杭州线', origin: '上海', destination: '杭州', distanceKm: 180 },
  { id: generateId(), name: '上海-南京线', origin: '上海', destination: '南京', distanceKm: 300 },
];

export const customers: Customer[] = [
  { id: generateId(), name: '北京生鲜超市', address: '北京市朝阳区建国路88号', contact: '陈经理 13800138001' },
  { id: generateId(), name: '广州冷链物流中心', address: '广州市天河区珠江新城', contact: '林总 13900139002' },
  { id: generateId(), name: '深圳食品有限公司', address: '深圳市南山区科技园', contact: '黄经理 13700137003' },
  { id: generateId(), name: '杭州农产品市场', address: '杭州市余杭区农副产品中心', contact: '吴总 13600136004' },
  { id: generateId(), name: '南京餐饮配送公司', address: '南京市鼓楼区汉中门大街', contact: '周经理 13500135005' },
];

export const probes: TemperatureProbe[] = [];
for (const v of vehicles) {
  for (let i = 1; i <= 2; i++) {
    const lastCal = now - 30 * DAY_MS * Math.random();
    const nextCal = lastCal + 180 * DAY_MS;
    const daysUntilNext = (nextCal - now) / DAY_MS;
    let status: 'valid' | 'expiring' | 'expired' = 'valid';
    if (daysUntilNext < 0) status = 'expired';
    else if (daysUntilNext < 30) status = 'expiring';
    
    probes.push({
      id: generateId(),
      vehicleId: v.id,
      boxId: `BOX-${i}`,
      lastCalibrationDate: new Date(lastCal).toISOString().split('T')[0],
      nextCalibrationDate: new Date(nextCal).toISOString().split('T')[0],
      calibrationStatus: status,
    });
  }
}

export const batches: DeliveryBatch[] = [];
export const tempRecords: TemperatureRecord[] = [];
export const posRecords: PositionRecord[] = [];
export const doorRecords: DoorRecord[] = [];
export const anomalies: AnomalyEvent[] = [];

for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
  const dayStart = new Date(now - dayOffset * DAY_MS);
  dayStart.setHours(6, 0, 0, 0);

  for (let vIdx = 0; vIdx < vehicles.length; vIdx++) {
    const vehicle = vehicles[vIdx];
    if (vehicle.status === 'maintenance') continue;
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    const startTime = dayStart.getTime() + vIdx * 2 * HOUR_MS;
    const duration = Math.floor((route.distanceKm / 60) * HOUR_MS);
    const estimatedArrival = startTime + duration;
    const delay = Math.random() > 0.7 ? Math.floor(Math.random() * 2 * HOUR_MS) : 0;
    const actualArrival = estimatedArrival + delay;
    const status: DeliveryBatch['status'] = delay > HOUR_MS ? 'exception' : 'delivered';
    
    const batchId = generateId();
    batches.push({
      id: batchId,
      vehicleId: vehicle.id,
      routeId: route.id,
      customerId: customer.id,
      startTime: new Date(startTime).toISOString(),
      estimatedArrival: new Date(estimatedArrival).toISOString(),
      actualArrival: new Date(actualArrival).toISOString(),
      status,
    });

    const vehicleProbes = probes.filter(p => p.vehicleId === vehicle.id);
    
    const anomalyStart = startTime + Math.floor(Math.random() * duration * 0.6);
    const anomalyDuration = Math.floor(Math.random() * 30 * 60 * 1000);
    const hasAnomaly = Math.random() > 0.5;
    
    for (let t = startTime; t < actualArrival; t += 5 * 60 * 1000) {
      for (const probe of vehicleProbes) {
        let temp = 2 + Math.random() * 4;
        const inAnomaly = hasAnomaly && t >= anomalyStart && t <= anomalyStart + anomalyDuration;
        if (inAnomaly) {
          temp = 8 + Math.random() * 5;
        }
        const isNormal = temp >= 0 && temp <= 8;
        
        tempRecords.push({
          id: generateId(),
          vehicleId: vehicle.id,
          batchId,
          probeId: probe.id,
          timestamp: new Date(t).toISOString(),
          temperature: Math.round(temp * 100) / 100,
          isNormal,
        });
      }

      const progress = (t - startTime) / duration;
      const baseLat = 31.2304 + (40.7128 - 31.2304) * progress;
      const baseLng = 121.4737 + (116.4074 - 121.4737) * progress;
      const lat = baseLat + (Math.random() - 0.5) * 0.1;
      const lng = baseLng + (Math.random() - 0.5) * 0.1;
      
      posRecords.push({
        id: generateId(),
        vehicleId: vehicle.id,
        timestamp: new Date(t).toISOString(),
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        speed: Math.round((50 + Math.random() * 30) * 10) / 10,
      });
    }

    if (hasAnomaly) {
      const anomalyType: AnomalyEvent['type'] = Math.random() > 0.5 ? 'temp_high' : 'door_open';
      const severity: AnomalyEvent['severity'] = Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low';
      anomalies.push({
        id: generateId(),
        batchId,
        vehicleId: vehicle.id,
        type: anomalyType,
        startTime: new Date(anomalyStart).toISOString(),
        endTime: new Date(anomalyStart + anomalyDuration).toISOString(),
        durationSeconds: Math.floor(anomalyDuration / 1000),
        severity,
        responsible: vehicle.driverName,
        description: anomalyType === 'temp_high' ? '运输途中温度异常升高' : '车门非正常开启',
        status: severity === 'high' ? 'pending' : 'processing',
      });

      if (anomalyType === 'door_open') {
        doorRecords.push({
          id: generateId(),
          vehicleId: vehicle.id,
          batchId,
          openTime: new Date(anomalyStart).toISOString(),
          closeTime: new Date(anomalyStart + anomalyDuration).toISOString(),
          durationSeconds: Math.floor(anomalyDuration / 1000),
          operator: vehicle.driverName,
        });
      }
    }

    const unloadingTime = actualArrival;
    doorRecords.push({
      id: generateId(),
      vehicleId: vehicle.id,
      batchId,
      openTime: new Date(unloadingTime).toISOString(),
      closeTime: new Date(unloadingTime + 15 * 60 * 1000).toISOString(),
      durationSeconds: 15 * 60,
      operator: '卸货员',
    });
  }
}

export const savedFilters: SavedFilter[] = [
  {
    id: generateId(),
    userId: 'default',
    name: '本周异常运输',
    filters: JSON.stringify({ timeRange: '7d', status: 'exception' }),
    createdAt: new Date(now - 2 * DAY_MS).toISOString(),
  },
  {
    id: generateId(),
    userId: 'default',
    name: '高温预警路线',
    filters: JSON.stringify({ anomalyType: 'temp_high', severity: 'high' }),
    createdAt: new Date(now - 5 * DAY_MS).toISOString(),
  },
];

export const dataQualityLogs: DataQualityLog[] = [
  {
    id: generateId(),
    dataDate: new Date(now).toISOString().split('T')[0],
    updateTime: new Date(now).toISOString(),
    completeness: 97.8,
    missingFields: [
      { field: 'temperature', missingCount: 12 },
      { field: 'position', missingCount: 5 },
      { field: 'door_records', missingCount: 3 },
    ],
    anomalyPoints: 23,
    isUpdateFailed: false,
    errorMessage: null,
  },
];
