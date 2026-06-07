import type {
  HeatmapData,
  QueuePrediction,
  TicketAnalysis,
  ConversionFunnel,
  RawRecord,
  DataQualityReport,
  KPIData,
  ClosedAreaNotice,
  FilterState
} from '@/types';
import { CALIBER_VERSION } from './calibers';

export const AREAS = [
  { id: 'area1', name: '主入口广场', capacity: 5000 },
  { id: 'area2', name: '过山车区', capacity: 2000 },
  { id: 'area3', name: '旋转木马区', capacity: 1500 },
  { id: 'area4', name: '水上乐园', capacity: 3000 },
  { id: 'area5', name: '演出剧场', capacity: 1200 },
  { id: 'area6', name: '美食街', capacity: 2500 },
  { id: 'area7', name: '纪念品商店', capacity: 800 },
  { id: 'area8', name: '儿童乐园', capacity: 1800 }
];

export const ENTRANCES = ['东门', '西门', '南门', '北门'];
export const TICKET_TYPES = ['成人票', '儿童票', '老人票', '学生票', 'VIP票', '家庭套票'];
export const ACTIVITIES = ['无活动', '周末特惠', '节日活动', '暑期档', '夜场活动'];

export const CLOSED_AREAS: ClosedAreaNotice[] = [
  {
    areaId: 'area4',
    areaName: '水上乐园',
    reason: '设备维护',
    capacityDeducted: 3000,
    startTime: new Date(Date.now() - 3600000 * 2),
    endTime: new Date(Date.now() + 3600000 * 4)
  }
];

function randomNormal(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getDefaultFilters(): FilterState {
  const now = new Date();
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  return {
    entrance: [],
    area: [],
    timeRange: { start, end: now },
    ticketType: [],
    activity: []
  };
}

export function generateHeatmapData(filters: FilterState): { data: HeatmapData[], sampleSize: number } {
  let totalSampleSize = 0;
  const data: HeatmapData[] = AREAS.map((area, idx) => {
    const isClosed = CLOSED_AREAS.some(c => c.areaId === area.id);
    const baseDensity = isClosed ? 0 : 0.3 + Math.random() * 0.6;
    const visitorCount = isClosed ? 0 : Math.floor(area.capacity * baseDensity);
    const sampleSize = Math.floor(visitorCount * (0.8 + Math.random() * 0.2));
    totalSampleSize += sampleSize;

    const angle = (idx / AREAS.length) * Math.PI * 2;
    const radius = 80 + idx * 25;
    const cx = 300 + Math.cos(angle) * radius;
    const cy = 200 + Math.sin(angle) * radius;
    const coordinates: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      coordinates.push([
        cx + Math.cos(a) * (50 + Math.random() * 20),
        cy + Math.sin(a) * (35 + Math.random() * 15)
      ]);
    }

    return {
      areaId: area.id,
      areaName: area.name,
      visitorCount,
      capacity: area.capacity,
      density: baseDensity,
      isClosed,
      coordinates
    };
  });
  return { data, sampleSize: totalSampleSize };
}

export function generateQueuePrediction(filters: FilterState, areaId?: string): { data: QueuePrediction[], sampleSize: number } {
  const now = new Date();
  const data: QueuePrediction[] = [];
  let totalSampleSize = 0;
  const targetAreas = areaId ? [areaId] : ['area1', 'area2', 'area5'];

  targetAreas.forEach(aid => {
    const area = AREAS.find(a => a.id === aid);
    if (!area) return;
    for (let i = -12; i <= 24; i++) {
      const timestamp = new Date(now.getTime() + i * 15 * 60 * 1000);
      const hour = timestamp.getHours();
      const baseWait = hour >= 10 && hour <= 18 ? 25 : 10;
      const peakBoost = (hour === 12 || hour === 15) ? 30 : 0;
      const predictedWait = Math.max(0, randomNormal(baseWait + peakBoost, 8));
      const std = 5 + predictedWait * 0.15;
      const lowerBound = Math.max(0, predictedWait - std * 1.96);
      const upperBound = predictedWait + std * 1.96;
      const confidence = 0.95;
      const isPast = i < 0;
      const actualWait = isPast ? Math.max(0, predictedWait + randomNormal(0, 6)) : undefined;
      const sampleSize = Math.floor(80 + Math.random() * 150);
      totalSampleSize += sampleSize;
      const isAnomaly = isPast && (actualWait! > predictedWait + std * 3 || actualWait! < Math.max(0, predictedWait - std * 3));

      data.push({
        timestamp,
        areaId: aid,
        areaName: area.name,
        predictedWait: Math.round(predictedWait),
        lowerBound: Math.round(lowerBound),
        upperBound: Math.round(upperBound),
        confidence,
        actualWait: actualWait ? Math.round(actualWait) : undefined,
        sampleSize,
        isAnomaly
      });
    }
  });

  return { data, sampleSize: totalSampleSize };
}

export function generateTicketAnalysis(filters: FilterState): { data: TicketAnalysis[], sampleSize: number } {
  let totalSampleSize = 0;
  const basePrices: Record<string, number> = {
    '成人票': 299,
    '儿童票': 180,
    '老人票': 150,
    '学生票': 220,
    'VIP票': 599,
    '家庭套票': 699
  };

  const data: TicketAnalysis[] = TICKET_TYPES.map(type => {
    const soldCount = Math.floor(randomNormal(800, 200));
    const entryRate = 0.78 + Math.random() * 0.18;
    const enteredCount = Math.floor(soldCount * entryRate);
    const avgSpend = basePrices[type] * (0.3 + Math.random() * 0.4);
    const sampleSize = Math.floor(soldCount * 0.95);
    totalSampleSize += sampleSize;

    return {
      ticketType: type,
      soldCount: Math.max(100, soldCount),
      enteredCount: Math.max(80, enteredCount),
      entryRate: Math.round(entryRate * 1000) / 1000,
      avgSpend: Math.round(avgSpend * 100) / 100,
      sampleSize
    };
  });

  return { data, sampleSize: totalSampleSize };
}

export function generateConversionFunnel(filters: FilterState): { data: ConversionFunnel[], sampleSize: number } {
  const stages = [
    { stage: 'tickets_sold', stageLabel: '门票售出' },
    { stage: 'entered_park', stageLabel: '入园' },
    { stage: 'food_consumption', stageLabel: '餐饮消费' },
    { stage: 'merchandise', stageLabel: '二次消费' }
  ];

  const baseCounts = [12000, 9800, 6200, 3100];
  let prevCount = baseCounts[0];

  const data: ConversionFunnel[] = stages.map((s, idx) => {
    const count = Math.floor(baseCounts[idx] * (0.95 + Math.random() * 0.1));
    const conversionRate = idx === 0 ? 1 : count / prevCount;
    const sampleSize = Math.floor(count * (0.9 + Math.random() * 0.1));
    prevCount = count;

    return {
      ...s,
      count,
      conversionRate: Math.round(conversionRate * 1000) / 1000,
      sampleSize
    };
  });

  return { data, sampleSize: data[data.length - 1].sampleSize };
}

export function generateKPIData(filters: FilterState): KPIData {
  return {
    realtimeVisitors: Math.floor(randomNormal(8500, 1500)),
    avgWaitTime: Math.round(randomNormal(18, 5) * 10) / 10,
    todayEntries: Math.floor(randomNormal(12000, 2000)),
    foodRevenue: Math.floor(randomNormal(850000, 150000)),
    visitorChange: Math.round((Math.random() - 0.45) * 20 * 10) / 10,
    waitChange: Math.round((Math.random() - 0.5) * 15 * 10) / 10,
    entryChange: Math.round((Math.random() - 0.4) * 18 * 10) / 10,
    revenueChange: Math.round((Math.random() - 0.35) * 25 * 10) / 10
  };
}

export function generateRawRecords(
  filters: FilterState,
  areaId?: string,
  type?: string,
  page: number = 1,
  pageSize: number = 50
): { data: RawRecord[], total: number, sampleSize: number } {
  const types: Array<'ticket' | 'gate' | 'parking' | 'consumption'> = ['ticket', 'gate', 'parking', 'consumption'];
  const total = 500 + Math.floor(Math.random() * 200);
  const actualPageSize = Math.min(pageSize, total - (page - 1) * pageSize);
  const data: RawRecord[] = [];

  for (let i = 0; i < actualPageSize; i++) {
    const recordType = type ? type as any : types[Math.floor(Math.random() * types.length)];
    const timestamp = new Date(Date.now() - Math.random() * 3600000 * 8);

    let recordData: Record<string, any> = {};
    switch (recordType) {
      case 'ticket':
        recordData = {
          ticketNo: 'TK' + generateId().toUpperCase(),
          ticketType: TICKET_TYPES[Math.floor(Math.random() * TICKET_TYPES.length)],
          price: [299, 180, 150, 220, 599, 699][Math.floor(Math.random() * 6)],
          channel: ['线上', '线下', '旅行社', 'OTA'][Math.floor(Math.random() * 4)],
          visitorId: 'V' + generateId()
        };
        break;
      case 'gate':
        recordData = {
          ticketNo: 'TK' + generateId().toUpperCase(),
          entrance: ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)],
          direction: Math.random() > 0.15 ? '入园' : '出园',
          area: areaId ? AREAS.find(a => a.id === areaId)?.name : AREAS[Math.floor(Math.random() * AREAS.length)].name,
          passDuration: Math.round(randomNormal(3, 1.5) * 10) / 10
        };
        break;
      case 'parking':
        recordData = {
          plateNo: '京A' + Math.floor(Math.random() * 90000 + 10000),
          parkingLot: ['P1', 'P2', 'P3'][Math.floor(Math.random() * 3)],
          duration: Math.floor(randomNormal(180, 60)),
          fee: Math.floor(randomNormal(60, 20))
        };
        break;
      case 'consumption':
        recordData = {
          orderNo: 'ORD' + generateId().toUpperCase(),
          category: ['餐饮', '纪念品', '游乐项目', '其他'][Math.floor(Math.random() * 4)],
          shopName: ['美味餐厅', '纪念品商店', '雪糕屋', '礼品店'][Math.floor(Math.random() * 4)],
          amount: Math.round(randomNormal(85, 40) * 100) / 100,
          visitorId: 'V' + generateId()
        };
        break;
    }

    data.push({
      id: generateId(),
      timestamp,
      type: recordType,
      data: recordData
    });
  }

  return { data, total, sampleSize: total };
}

export function generateDataQualityReport(): DataQualityReport {
  const fields = ['ticket_no', 'pass_time', 'entrance', 'amount', 'visitor_id', 'plate_no'];
  const fieldMissingRates: Record<string, number> = {};
  fields.forEach(f => {
    fieldMissingRates[f] = Math.round(Math.random() * 45) / 10;
  });

  const totalMissing = Object.values(fieldMissingRates).reduce((a, b) => a + b, 0) / fields.length;

  return {
    missingValueRate: Math.round(totalMissing * 10) / 10,
    anomalyCount: Math.floor(randomNormal(23, 8)),
    totalSampleSize: Math.floor(randomNormal(45000, 8000)),
    lastUpdateTime: new Date(Date.now() - Math.random() * 180000),
    caliberVersion: CALIBER_VERSION,
    fieldMissingRates
  };
}

export function detectAnomalies(values: number[]): number[] {
  if (values.length < 3) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return values
    .map((v, i) => (Math.abs(v - mean) > 3 * std ? i : -1))
    .filter(i => i >= 0);
}
