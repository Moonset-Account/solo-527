import type { UserPermission, Greenhouse, Sensor, SensorReading, CropBatch } from '$lib/types';

export const MOCK_USER: UserPermission = {
  userId: 'tech-001',
  role: 'technician',
  allowedGreenhouses: ['gh-001', 'gh-002', 'gh-003'],
  canExport: true,
  canImport: true,
  canConfigure: false
};

export function applyPermissionFilter<T extends { greenhouseId?: string; id?: string }>(
  data: T[],
  user: UserPermission
): T[] {
  if (user.role === 'admin') return data;
  return data.filter((item) => {
    const ghId = item.greenhouseId || item.id;
    return ghId ? user.allowedGreenhouses.includes(ghId) : true;
  });
}

export function filterByGreenhouseIds<T extends { greenhouseId: string }>(
  data: T[],
  greenhouseIds: string[]
): T[] {
  if (greenhouseIds.length === 0) return data;
  return data.filter((item) => greenhouseIds.includes(item.greenhouseId));
}

export function filterByTimeRange<T extends { timestamp: string }>(
  data: T[],
  start: string,
  end: string
): T[] {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return data.filter((item) => {
    const t = new Date(item.timestamp).getTime();
    return t >= startTime && t <= endTime;
  });
}

export function filterBySensorIds(data: SensorReading[], sensorIds: string[]): SensorReading[] {
  if (sensorIds.length === 0) return data;
  return data.filter((item) => sensorIds.includes(item.sensorId));
}

export function filterBySensorTypes(
  data: SensorReading[],
  sensors: Sensor[],
  sensorTypes: string[]
): SensorReading[] {
  if (sensorTypes.length === 0) return data;
  const sensorIdSet = new Set(
    sensors.filter((s) => sensorTypes.includes(s.type)).map((s) => s.id)
  );
  return data.filter((item) => sensorIdSet.has(item.sensorId));
}

export function generateGreenhouses(): Greenhouse[] {
  return [
    {
      id: 'gh-001',
      name: '1号温室',
      location: 'A区',
      area: 500,
      createdAt: '2024-01-15T00:00:00Z',
      sensorCount: 12,
      valveCount: 4
    },
    {
      id: 'gh-002',
      name: '2号温室',
      location: 'B区',
      area: 600,
      createdAt: '2024-02-20T00:00:00Z',
      sensorCount: 15,
      valveCount: 5
    },
    {
      id: 'gh-003',
      name: '3号温室',
      location: 'C区',
      area: 450,
      createdAt: '2024-03-10T00:00:00Z',
      sensorCount: 10,
      valveCount: 3
    }
  ];
}

export function generateSensors(): Sensor[] {
  const greenhouseIds = ['gh-001', 'gh-002', 'gh-003'];
  const types: Array<{ type: any; unit: string; min: number; max: number; idealMin: number; idealMax: number }> = [
    { type: 'temperature', unit: '°C', min: 10, max: 40, idealMin: 18, idealMax: 28 },
    { type: 'humidity', unit: '%', min: 30, max: 95, idealMin: 60, idealMax: 85 },
    { type: 'light', unit: 'lux', min: 0, max: 100000, idealMin: 10000, idealMax: 60000 },
    { type: 'soil_moisture', unit: '%', min: 10, max: 90, idealMin: 40, idealMax: 70 }
  ];
  const locations = ['东', '西', '南', '北', '中'];
  const sensors: Sensor[] = [];

  let idx = 1;
  for (const ghId of greenhouseIds) {
    for (const t of types) {
      for (let i = 0; i < 3; i++) {
        const isOffline = idx % 13 === 0;
        const now = new Date();
        const lastSeen = isOffline
          ? new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
          : now.toISOString();

        sensors.push({
          id: `sen-${String(idx).padStart(3, '0')}`,
          greenhouseId: ghId,
          name: `${t.type}-${locations[i % locations.length]}`,
          type: t.type,
          unit: t.unit,
          location: locations[i % locations.length] + '侧',
          status: isOffline ? 'offline' : idx % 7 === 0 ? 'warning' : 'online',
          lastSeen,
          samplingInterval: 300,
          thresholdMin: t.idealMin - 5,
          thresholdMax: t.idealMax + 5,
          installedAt: '2024-01-01T00:00:00Z'
        });
        idx++;
      }
    }
  }

  return sensors;
}

export function generateValves() {
  const greenhouseIds = ['gh-001', 'gh-002', 'gh-003'];
  const zones = ['A区', 'B区', 'C区', 'D区', 'E区'];
  const valves = [];
  let idx = 1;

  for (const ghId of greenhouseIds) {
    const valveCount = ghId === 'gh-002' ? 5 : ghId === 'gh-001' ? 4 : 3;
    for (let i = 0; i < valveCount; i++) {
      valves.push({
        id: `valve-${String(idx).padStart(3, '0')}`,
        greenhouseId: ghId,
        name: `灌溉阀-${zones[i]}`,
        zone: zones[i],
        status: idx % 9 === 0 ? 'fault' : idx % 5 === 0 ? 'open' : 'closed',
        flowRate: 100 + Math.random() * 50,
        lastOpened: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        lastClosed: new Date(Date.now() - Math.random() * 43200000).toISOString(),
        totalWaterToday: Math.random() * 500
      });
      idx++;
    }
  }

  return valves;
}

export function generateBatches(): CropBatch[] {
  const greenhouseIds = ['gh-001', 'gh-002', 'gh-003'];
  const crops = [
    { type: '番茄', variety: '圣桃1号', days: 90 },
    { type: '黄瓜', variety: '津优35', days: 60 },
    { type: '生菜', variety: '美国大速生', days: 45 },
    { type: '草莓', variety: '红颜', days: 120 }
  ];
  const phases: Array<'sowing' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest'> = ['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'harvest'];
  const batches: CropBatch[] = [];
  let idx = 1;

  for (const ghId of greenhouseIds) {
    for (let i = 0; i < 2; i++) {
      const crop = crops[(idx - 1) % crops.length];
      const sowingDate = new Date(Date.now() - idx * 7 * 86400000);
      const phaseIdx = Math.min(
        Math.floor((Date.now() - sowingDate.getTime()) / (crop.days * 86400000 / 6)),
        5
      );

      batches.push({
        id: `batch-${String(idx).padStart(3, '0')}`,
        greenhouseId: ghId,
        cropType: crop.type,
        variety: crop.variety,
        sowingDate: sowingDate.toISOString(),
        expectedHarvestDate: new Date(sowingDate.getTime() + crop.days * 86400000).toISOString(),
        phase: phases[phaseIdx],
        plantCount: 500 + Math.floor(Math.random() * 500),
        expectedYield: 2000 + Math.random() * 3000,
        status: (phaseIdx === 5 ? 'completed' : 'active') as 'active' | 'completed' | 'failed'
      });
      idx++;
    }
  }

  return batches;
}

export function generateSensorReadings(
  sensors: Sensor[],
  days: number = 7,
  batches: CropBatch[] = []
): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const interval = 300 * 1000;
  const pointsPerSensor = Math.floor((days * 86400 * 1000) / interval);

  const greenhouseBatches: Record<string, string[]> = {};
  batches.forEach((b) => {
    if (!greenhouseBatches[b.greenhouseId]) {
      greenhouseBatches[b.greenhouseId] = [];
    }
    greenhouseBatches[b.greenhouseId].push(b.id);
  });

  sensors.forEach((sensor, sIdx) => {
    const baseValues: Record<string, number> = {
      temperature: 22,
      humidity: 70,
      light: 30000,
      soil_moisture: 55
    };
    const base = baseValues[sensor.type];

    const ghBatches = greenhouseBatches[sensor.greenhouseId] || [];
    const assignedBatch = ghBatches.length > 0 && Math.random() > 0.3
      ? ghBatches[Math.floor(Math.random() * ghBatches.length)]
      : undefined;

    for (let i = 0; i < pointsPerSensor; i++) {
      const timestamp = new Date(now - (pointsPerSensor - i) * interval);
      const hour = timestamp.getHours();
      let value = base;

      if (sensor.type === 'temperature') {
        value += 5 * Math.sin((hour - 6) * Math.PI / 12);
      } else if (sensor.type === 'light') {
        value = hour >= 6 && hour <= 18 ? 40000 * Math.sin((hour - 6) * Math.PI / 12) : 0;
      } else if (sensor.type === 'humidity') {
        value -= 10 * Math.sin((hour - 6) * Math.PI / 12);
      }

      value += (Math.random() - 0.5) * base * 0.1;

      const isMissing = Math.random() < 0.02;
      const isOutlier = Math.random() < 0.01;

      if (isOutlier) {
        value *= 1.5 + Math.random();
      }

      readings.push({
        id: `read-${sIdx}-${i}`,
        sensorId: sensor.id,
        greenhouseId: sensor.greenhouseId,
        timestamp: timestamp.toISOString(),
        value: isMissing ? NaN : value,
        quality: isMissing ? 'missing' : isOutlier ? 'outlier' : 'good',
        isMissing,
        isOutlier,
        batchId: assignedBatch
      });
    }
  });

  return readings;
}

export function generateIrrigationEvents(valves: any[], days: number = 7) {
  const events: any[] = [];
  const now = Date.now();
  let idx = 1;

  valves.forEach((valve, vIdx) => {
    for (let day = 0; day < days; day++) {
      const eventsPerDay = 2 + Math.floor(Math.random() * 2);
      for (let e = 0; e < eventsPerDay; e++) {
        const startTime = new Date(now - day * 86400000 - (6 + e * 4) * 3600000);
        const duration = 900 + Math.random() * 1800;
        const endTime = new Date(startTime.getTime() + duration * 1000);

        events.push({
          id: `irr-${String(idx).padStart(5, '0')}`,
          valveId: valve.id,
          greenhouseId: valve.greenhouseId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.floor(duration),
          waterVolume: Math.floor(valve.flowRate * duration / 60),
          reason: ['定时灌溉', '土壤水分低', '人工干预'][Math.floor(Math.random() * 3)],
          batchId: null
        });
        idx++;
      }
    }
  });

  return events;
}

export function generateAlerts(sensors: any[], valves: any[], readings: SensorReading[] = []) {
  const alerts: any[] = [];
  const now = Date.now();
  let idx = 1;

  const readingsBySensor: Record<string, SensorReading[]> = {};
  readings.forEach((r) => {
    if (!readingsBySensor[r.sensorId]) {
      readingsBySensor[r.sensorId] = [];
    }
    readingsBySensor[r.sensorId].push(r);
  });

  sensors.forEach((sensor, sIdx) => {
    const sensorReadings = readingsBySensor[sensor.id] || [];
    const outlierReadings = sensorReadings.filter((r) => r.isOutlier);

    if (sensor.status === 'offline') {
      alerts.push({
        id: `alert-${String(idx++).padStart(5, '0')}`,
        greenhouseId: sensor.greenhouseId,
        sensorId: sensor.id,
        type: 'offline',
        level: 'critical',
        message: `传感器 ${sensor.name} 已离线超过2小时`,
        timestamp: new Date(now - 7200000).toISOString(),
        resolved: false
      });
    }

    if (Math.random() < 0.3 && outlierReadings.length > 0) {
      const randomOutlier = outlierReadings[Math.floor(Math.random() * outlierReadings.length)];
      alerts.push({
        id: `alert-${String(idx++).padStart(5, '0')}`,
        greenhouseId: sensor.greenhouseId,
        sensorId: sensor.id,
        type: 'threshold',
        level: Math.random() < 0.5 ? 'warning' : 'critical',
        message: `${sensor.name} 超出阈值范围`,
        timestamp: randomOutlier.timestamp,
        resolved: Math.random() < 0.5,
        readingId: randomOutlier.id
      });
    }

    if (Math.random() < 0.2 && outlierReadings.length > 0) {
      const randomOutlier = outlierReadings[Math.floor(Math.random() * outlierReadings.length)];
      alerts.push({
        id: `alert-${String(idx++).padStart(5, '0')}`,
        greenhouseId: sensor.greenhouseId,
        sensorId: sensor.id,
        type: 'anomaly',
        level: 'warning',
        message: `${sensor.name} 检测到异常数据点`,
        timestamp: randomOutlier.timestamp,
        resolved: Math.random() < 0.6,
        readingId: randomOutlier.id
      });
    }
  });

  valves.forEach((valve) => {
    if (valve.status === 'fault') {
      alerts.push({
        id: `alert-${String(idx++).padStart(5, '0')}`,
        greenhouseId: valve.greenhouseId,
        valveId: valve.id,
        type: 'valve_fault',
        level: 'critical',
        message: `灌溉阀 ${valve.name} 故障`,
        timestamp: new Date(now - 3600000).toISOString(),
        resolved: false
      });
    }
  });

  return alerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
