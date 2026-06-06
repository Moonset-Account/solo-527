import type { Station, TripRecord, DispatchRecord, Alert, StationTrend } from '@shared/types';

const AREAS = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区'];
const WEATHER_TYPES = ['晴', '多云', '小雨', '阴', '中雨', '大雪'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const now = Date.now();

export const mockStations: Station[] = Array.from({ length: 50 }, (_, i) => {
  const capacity = randomBetween(20, 60);
  const maintenance = randomBetween(0, 5);
  const available = randomBetween(0, capacity - maintenance);
  const ratio = available / capacity;
  let status: Station['status'] = 'normal';
  if (ratio < 0.1) status = 'low';
  else if (ratio > 0.9) status = 'full';
  else if (maintenance > 3) status = 'maintenance';

  return {
    id: `S${String(i + 1).padStart(3, '0')}`,
    name: `${pickRandom(['地铁', '商场', '公园', '小区', '写字楼', '学校'])}${i + 1}号站`,
    area: pickRandom(AREAS),
    lng: 116.3 + (Math.random() - 0.5) * 0.4,
    lat: 39.9 + (Math.random() - 0.5) * 0.3,
    capacity,
    availableBikes: available,
    availableDocks: capacity - available,
    maintenanceBikes: maintenance,
    status,
    lastUpdate: now - randomBetween(0, 300000),
  };
});

export const mockTrips: TripRecord[] = Array.from({ length: 5000 }, (_, i) => {
  const startStation = pickRandom(mockStations);
  let endStation = pickRandom(mockStations);
  while (endStation.id === startStation.id) {
    endStation = pickRandom(mockStations);
  }
  const startTime = now - randomBetween(0, 7 * 24 * 3600 * 1000);
  const duration = randomBetween(5 * 60, 60 * 60);
  return {
    id: `T${String(i + 1).padStart(6, '0')}`,
    startTime,
    endTime: startTime + duration * 1000,
    startStationId: startStation.id,
    endStationId: endStation.id,
    bikeId: `B${String(randomBetween(1, 3000)).padStart(5, '0')}`,
    duration,
    distance: randomBetween(500, 10000),
    weather: pickRandom(WEATHER_TYPES),
  };
});

export const mockDispatches: DispatchRecord[] = Array.from({ length: 100 }, (_, i) => {
  const fromStation = pickRandom(mockStations);
  let toStation = pickRandom(mockStations);
  while (toStation.id === fromStation.id) {
    toStation = pickRandom(mockStations);
  }
  const statuses: DispatchRecord['status'][] = ['pending', 'processing', 'completed', 'failed'];
  const status = pickRandom(statuses);
  return {
    id: `D${String(i + 1).padStart(5, '0')}`,
    createTime: now - randomBetween(0, 7 * 24 * 3600 * 1000),
    executeTime: now - randomBetween(0, 7 * 24 * 3600 * 1000),
    fromStationId: fromStation.id,
    toStationId: toStation.id,
    bikeCount: randomBetween(3, 15),
    operator: pickRandom(['张三', '李四', '王五', '赵六', '钱七']),
    status,
    effectScore: status === 'completed' ? Math.random() * 100 : undefined,
  };
});

export const mockAlerts: Alert[] = mockStations
  .filter(s => s.status === 'low' || s.status === 'full' || s.maintenanceBikes > 3)
  .map((s, i) => {
    let type: Alert['type'] = 'shortage';
    let level: Alert['level'] = 'medium';
    let message = '';
    if (s.status === 'low') {
      type = 'shortage';
      level = s.availableBikes < 3 ? 'high' : 'medium';
      message = `车辆不足，仅剩${s.availableBikes}辆`;
    } else if (s.status === 'full') {
      type = 'overflow';
      level = s.availableDocks < 3 ? 'high' : 'medium';
      message = `车辆堆积，仅剩${s.availableDocks}个空位`;
    } else if (s.maintenanceBikes > 3) {
      type = 'maintenance_timeout';
      level = 'low';
      message = `${s.maintenanceBikes}辆车维修超时`;
    }
    return {
      id: `A${String(i + 1).padStart(4, '0')}`,
      stationId: s.id,
      stationName: s.name,
      type,
      level,
      message,
      createTime: now - randomBetween(0, 2 * 3600 * 1000),
    };
  });

export function generateStationTrend(stationId: string): StationTrend[] {
  const trend: StationTrend[] = [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const station = mockStations.find(s => s.id === stationId);
  const baseBikes = station?.availableBikes || 20;
  
  for (let h = 0; h < 24; h++) {
    const timestamp = startOfDay.getTime() + h * 3600 * 1000;
    let multiplier = 1;
    if (h >= 7 && h <= 9) multiplier = 1.8;
    else if (h >= 17 && h <= 19) multiplier = 2.0;
    else if (h >= 12 && h <= 14) multiplier = 1.2;
    else if (h >= 0 && h <= 5) multiplier = 0.2;
    
    const outgoing = Math.floor(randomBetween(5, 20) * multiplier);
    const incoming = Math.floor(randomBetween(5, 20) * multiplier * 0.9);
    
    trend.push({
      timestamp,
      availableBikes: Math.max(0, baseBikes + incoming - outgoing),
      incomingTrips: incoming,
      outgoingTrips: outgoing,
    });
  }
  return trend;
}

export const mockMetricConfig = {
  availableInventory: {
    formula: 'totalBikes - maintenanceBikes',
    description: '可调度库存 = 总车辆数 - 维修中车辆',
  },
  peakHours: {
    morning: [7, 9] as [number, number],
    evening: [17, 19] as [number, number],
    description: '早晚高峰时段定义',
  },
  alertThresholds: {
    shortage: 0.1,
    overflow: 0.9,
    description: '站点余量低于10%告警，高于90%告警',
  },
  serviceLevel: {
    formula: 'availableBikes / capacity',
    thresholds: { good: 0.3, warning: 0.15, critical: 0.05 },
  },
};
