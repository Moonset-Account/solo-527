import { dataStore } from './store';
import type { HeatmapData, QueuePrediction, TicketAnalysis, ConversionFunnel, KPIData, RawRecord, DataQualityReport } from '../../src/types';

export interface FilterParams {
  startTime?: string;
  endTime?: string;
  entrance?: string[];
  areaId?: string[];
  ticketType?: string[];
  activity?: string[];
}

function filterByTime<T extends { sellTime?: Date; passTime?: Date; consumeTime?: Date; recordTime?: Date; enterTime?: Date; startTime?: Date }>(
  records: T[],
  startTime?: string,
  endTime?: string
): T[] {
  if (!startTime && !endTime) return records;
  const start = startTime ? new Date(startTime) : new Date(0);
  const end = endTime ? new Date(endTime) : new Date(Date.now() + 86400000);
  return records.filter(r => {
    const t = r.sellTime || r.passTime || r.consumeTime || r.recordTime || r.enterTime || r.startTime;
    return t >= start && t <= end;
  });
}

export function getHeatmapData(filter: FilterParams = {}): HeatmapData[] {
  const areas = dataStore.getAreaList();
  const closedIds = dataStore.getClosedAreaIds();
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime);
  const filteredGates = gates.filter(g => {
    if (filter.entrance?.length && !filter.entrance.includes(g.entrance)) return false;
    if (filter.areaId?.length && !filter.areaId.includes(g.areaId)) return false;
    if (filter.activity?.length && !filter.activity.includes(g.activity)) return false;
    return true;
  });

  return areas.map(area => {
    const areaRecords = filteredGates.filter(g => g.areaId === area.id && g.direction === 'in');
    const visitorCount = areaRecords.length;
    const density = Math.min(1, visitorCount / (area.capacity * 0.6));
    const avgQueueTime = areaRecords.length > 0
      ? areaRecords.reduce((s, r) => s + r.queueDuration, 0) / areaRecords.length
      : 0;
    const isClosed = closedIds.includes(area.id);

    return {
      areaId: area.id,
      areaName: area.name,
      visitorCount: isClosed ? 0 : visitorCount,
      density: isClosed ? 0 : density,
      avgQueueTime: isClosed ? 0 : Math.round(avgQueueTime * 10) / 10,
      capacity: area.capacity,
      isClosed,
      coordinates: generateAreaCoordinates(area.id)
    };
  });
}

function generateAreaCoordinates(areaId: string): [number, number][] {
  const base: Record<string, [number, number][]> = {
    'area1': [[50, 30], [120, 30], [120, 80], [50, 80]],
    'area2': [[140, 30], [230, 30], [230, 100], [140, 100]],
    'area3': [[250, 30], [330, 30], [330, 90], [250, 90]],
    'area4': [[350, 30], [430, 30], [430, 100], [350, 100]],
    'area5': [[50, 100], [130, 100], [130, 160], [50, 160]],
    'area6': [[150, 110], [240, 110], [240, 170], [150, 170]],
    'area7': [[260, 100], [340, 100], [340, 150], [260, 150]],
    'area8': [[360, 110], [450, 110], [450, 170], [360, 170]]
  };
  return base[areaId] || [[0, 0], [50, 0], [50, 50], [0, 50]];
}

export function getQueuePrediction(filter: FilterParams = {}): QueuePrediction[] {
  const now = new Date();
  const result: QueuePrediction[] = [];
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime);
  const filteredGates = gates.filter(g => {
    if (filter.entrance?.length && !filter.entrance.includes(g.entrance)) return false;
    if (filter.areaId?.length && !filter.areaId.includes(g.areaId)) return false;
    if (filter.activity?.length && !filter.activity.includes(g.activity)) return false;
    return true;
  });

  for (let i = -12; i <= 24; i++) {
    const time = new Date(now);
    time.setMinutes(time.getMinutes() + i * 15);
    const bucketStart = new Date(time);
    bucketStart.setMinutes(0, 0, 0);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setMinutes(15, 0, 0);

    const inBucket = filteredGates.filter(g => g.passTime >= bucketStart && g.passTime < bucketEnd && g.direction === 'in');
    const actualCount = i <= 0 ? inBucket.length : null;
    const predictedBase = 200 + Math.sin((i + 12) * 0.3) * 150 + 100;
    const predictedCount = i > 0 ? Math.max(0, Math.round(predictedBase + (Math.random() - 0.5) * 50)) : null;
    const stdDev = 45;
    const avgWait = inBucket.length > 0
      ? inBucket.reduce((s, r) => s + r.queueDuration, 0) / inBucket.length
      : predictedCount ? Math.min(45, predictedCount * 0.08) : 0;

    const mean = avgWait;
    const isHistory = i <= 0;
    const isAnomaly = isHistory && (Math.random() < 0.08);

    result.push({
      time: time.toISOString(),
      actualCount,
      predictedCount,
      confidenceLower: predictedCount ? Math.max(0, predictedCount - 1.96 * stdDev) : null,
      confidenceUpper: predictedCount ? predictedCount + 1.96 * stdDev : null,
      avgWaitTime: Math.round(mean * 10) / 10,
      isAnomaly,
      isHistory
    });
  }

  return result;
}

export function getTicketAnalysis(filter: FilterParams = {}): TicketAnalysis[] {
  const tickets = filterByTime(dataStore.tickets, filter.startTime, filter.endTime);
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime);
  const ticketNosUsed = new Set(gates.filter(g => g.direction === 'in'
    && (!filter.activity?.length || filter.activity.includes(g.activity))
  ).map(g => g.ticketNo));
  const filteredTickets = tickets.filter(t => {
    if (filter.ticketType?.length && !filter.ticketType.includes(t.ticketType)) return false;
    if (filter.activity?.length && !filter.activity.includes(t.activity)) return false;
    return true;
  });

  const byType = new Map<string, { sold: number; entered: number; revenue: number }>();
  filteredTickets.forEach(t => {
    const existing = byType.get(t.ticketType) || { sold: 0, entered: 0, revenue: 0 };
    existing.sold++;
    existing.revenue += t.price;
    if (ticketNosUsed.has(t.ticketNo)) existing.entered++;
    byType.set(t.ticketType, existing);
  });

  return dataStore.getTicketTypes().map(type => {
    const data = byType.get(type) || { sold: 0, entered: 0, revenue: 0 };
    const entryRate = data.sold > 0 ? (data.entered / data.sold) : 0;
    const avgPrice = data.sold > 0 ? (data.revenue / data.sold) : 0;
    return {
      ticketType: type,
      soldCount: data.sold,
      enteredCount: data.entered,
      entryRate: Math.round(entryRate * 1000) / 10,
      avgPrice: Math.round(avgPrice * 100) / 100,
      totalRevenue: Math.round(data.revenue * 100) / 100
    };
  });
}

export function getConversionFunnel(filter: FilterParams = {}): ConversionFunnel[] {
  const tickets = filterByTime(dataStore.tickets, filter.startTime, filter.endTime);
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime);
  const consumptions = filterByTime(dataStore.consumptions, filter.startTime, filter.endTime);
  const filteredTickets = tickets.filter(t => {
    if (filter.ticketType?.length && !filter.ticketType.includes(t.ticketType)) return false;
    if (filter.activity?.length && !filter.activity.includes(t.activity)) return false;
    return true;
  });

  const visitorsWithTicket = new Set(filteredTickets.map(t => t.visitorId));
  const ticketNosIn = gates.filter(g => g.direction === 'in'
    && (!filter.activity?.length || filter.activity.includes(g.activity))
  ).map(g => g.ticketNo);
  const enteredVisitors = new Set<string>();
  const ticketMap = new Map(filteredTickets.map(t => [t.ticketNo, t.visitorId]));
  ticketNosIn.forEach(no => {
    const v = ticketMap.get(no);
    if (v) enteredVisitors.add(v);
  });
  const consumingVisitors = new Set(consumptions
    .filter(c => visitorsWithTicket.has(c.visitorId))
    .filter(c => !filter.activity?.length || filter.activity.includes(c.activity))
    .map(c => c.visitorId));
  const highValueVisitors = new Set(consumptions
    .filter(c => c.amount > 150 && visitorsWithTicket.has(c.visitorId))
    .filter(c => !filter.activity?.length || filter.activity.includes(c.activity))
    .map(c => c.visitorId));

  return [
    { stage: '购买门票', count: visitorsWithTicket.size, rate: 100 },
    { stage: '检票入园', count: enteredVisitors.size, rate: Math.round((enteredVisitors.size / visitorsWithTicket.size) * 1000) / 10 },
    { stage: '餐饮消费', count: consumingVisitors.size, rate: Math.round((consumingVisitors.size / visitorsWithTicket.size) * 1000) / 10 },
    { stage: '二次消费', count: highValueVisitors.size, rate: Math.round((highValueVisitors.size / visitorsWithTicket.size) * 1000) / 10 }
  ];
}

export function getKPIData(filter: FilterParams = {}): KPIData {
  const tickets = filterByTime(dataStore.tickets, filter.startTime, filter.endTime)
    .filter(t => !filter.activity?.length || filter.activity.includes(t.activity));
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime)
    .filter(g => !filter.activity?.length || filter.activity.includes(g.activity));
  const consumptions = filterByTime(dataStore.consumptions, filter.startTime, filter.endTime)
    .filter(c => !filter.activity?.length || filter.activity.includes(c.activity));
  const parkings = filterByTime(dataStore.parkings, filter.startTime, filter.endTime)
    .filter(p => !filter.activity?.length || filter.activity.includes(p.activity));
  const closedIds = dataStore.getClosedAreaIds();
  const areas = dataStore.getAreaList();

  const totalCapacity = areas.filter(a => !closedIds.includes(a.id)).reduce((s, a) => s + a.capacity, 0);
  const currentInPark = gates.filter(g => g.direction === 'in').length - gates.filter(g => g.direction === 'out').length;
  const parkingOccupancy = parkings.filter(p => !p.exitTime).length;

  return {
    realtimeVisitor: Math.max(0, currentInPark),
    totalCapacity,
    occupancyRate: Math.round((currentInPark / totalCapacity) * 1000) / 10,
    avgWaitTime: Math.round(gates.filter(g => g.direction === 'in').reduce((s, g) => s + g.queueDuration, 0) / Math.max(1, gates.filter(g => g.direction === 'in').length) * 10) / 10,
    ticketSales: tickets.length,
    totalRevenue: Math.round((tickets.reduce((s, t) => s + t.price, 0) + consumptions.reduce((s, c) => s + c.amount, 0)) * 100) / 100,
    parkingOccupancy,
    parkingCapacity: 1200,
    parkingRate: Math.round((parkingOccupancy / 1200) * 1000) / 10,
    updatedAt: dataStore.lastUpdate.toISOString()
  };
}

export function getRawRecords(filter: FilterParams & { page?: number; pageSize?: number; source?: string } = {}): { list: RawRecord[]; total: number; page: number; pageSize: number } {
  const { page = 1, pageSize = 20, source } = filter;
  let allRecords: RawRecord[] = [];

  if (!source || source === 'ticket') {
    allRecords.push(...filterByTime(dataStore.tickets, filter.startTime, filter.endTime)
      .filter(t => !filter.activity?.length || filter.activity.includes(t.activity))
      .map(t => ({
        id: t.id,
        source: 'ticket' as const,
        time: t.sellTime.toISOString(),
        title: `门票售出: ${t.ticketType}`,
        description: `票号 ${t.ticketNo}，${t.channel}渠道，¥${t.price}，${t.activity}`,
        metadata: { ticketNo: t.ticketNo, ticketType: t.ticketType, price: t.price, channel: t.channel, visitorId: t.visitorId, activity: t.activity }
      })));
  }

  if (!source || source === 'gate') {
    allRecords.push(...filterByTime(dataStore.gates, filter.startTime, filter.endTime)
      .filter(g => !filter.entrance?.length || filter.entrance.includes(g.entrance))
      .filter(g => !filter.areaId?.length || filter.areaId.includes(g.areaId))
      .filter(g => !filter.activity?.length || filter.activity.includes(g.activity))
      .map(g => ({
        id: g.id,
        source: 'gate' as const,
        time: g.passTime.toISOString(),
        title: `闸机${g.direction === 'in' ? '入园' : '出园'}: ${g.entrance}`,
        description: `票号 ${g.ticketNo}，${g.area}，排队 ${g.queueDuration.toFixed(1)}分钟，${g.activity}`,
        metadata: { ticketNo: g.ticketNo, entrance: g.entrance, area: g.area, areaId: g.areaId, direction: g.direction, queueDuration: g.queueDuration, activity: g.activity }
      })));
  }

  if (!source || source === 'consumption') {
    allRecords.push(...filterByTime(dataStore.consumptions, filter.startTime, filter.endTime)
      .filter(c => !filter.activity?.length || filter.activity.includes(c.activity))
      .map(c => ({
        id: c.id,
        source: 'consumption' as const,
        time: c.consumeTime.toISOString(),
        title: `${c.category}消费: ${c.shopName}`,
        description: `订单 ${c.orderNo}，¥${c.amount.toFixed(2)}，${c.activity}`,
        metadata: { orderNo: c.orderNo, category: c.category, shopName: c.shopName, amount: c.amount, visitorId: c.visitorId, activity: c.activity }
      })));
  }

  if (!source || source === 'parking') {
    allRecords.push(...filterByTime(dataStore.parkings, filter.startTime, filter.endTime)
      .filter(p => !filter.areaId?.length || filter.areaId.includes(p.areaId))
      .filter(p => !filter.activity?.length || filter.activity.includes(p.activity))
      .map(p => ({
        id: p.id,
        source: 'parking' as const,
        time: p.enterTime.toISOString(),
        title: p.exitTime ? '车辆离场' : '车辆入场',
        description: `车牌 ${p.plateNo}，${p.parkingLot}，${p.area}，${p.duration ? p.duration.toFixed(1) + '小时' : '停车中'}，${p.activity}`,
        metadata: { plateNo: p.plateNo, parkingLot: p.parkingLot, area: p.area, areaId: p.areaId, duration: p.duration, fee: p.fee, exitTime: p.exitTime?.toISOString(), activity: p.activity }
      })));
  }

  if (!source || source === 'weather') {
    if (!filter.activity?.length) {
      allRecords.push(...filterByTime(dataStore.weathers, filter.startTime, filter.endTime)
        .map(w => ({
          id: w.id,
          source: 'weather' as const,
          time: w.recordTime.toISOString(),
          title: `天气记录: ${w.weather}`,
          description: `温度 ${w.temperature.toFixed(1)}°C，湿度 ${w.humidity}%，风速 ${w.windSpeed.toFixed(1)}m/s`,
          metadata: { temperature: w.temperature, humidity: w.humidity, weather: w.weather, windSpeed: w.windSpeed }
        })));
    }
  }

  if (!source || source === 'show') {
    allRecords.push(...filterByTime(dataStore.shows, filter.startTime, filter.endTime)
      .filter(s => !filter.areaId?.length || filter.areaId.includes(s.areaId))
      .filter(s => !filter.activity?.length || filter.activity.includes(s.activity))
      .map(s => ({
        id: s.id,
        source: 'show' as const,
        time: s.startTime.toISOString(),
        title: `演出: ${s.showName}`,
        description: `${s.venue}，观众 ${s.audienceCount}/${s.capacity}，时长 ${Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000)}分钟，${s.activity}`,
        metadata: { showName: s.showName, venue: s.venue, area: s.area, areaId: s.areaId, capacity: s.capacity, audienceCount: s.audienceCount, endTime: s.endTime.toISOString(), activity: s.activity }
      })));
  }

  allRecords.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const total = allRecords.length;
  const start = (page - 1) * pageSize;
  const list = allRecords.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

const CALIBER_VERSION = 'v2.1.0';

interface SourceStats {
  fieldName: string;
  recordCount: number;
  missingCount: number;
  missingRate: number;
  outlierCount: number;
  outlierRate: number;
  completeness: number;
  hasOutliers: boolean;
  sampleSize: number;
}

function calcSourceStats(name: string, records: any[], outlierCheck: (r: any) => boolean): SourceStats {
  const recordCount = records.length;
  let missingCount = 0;
  let outlierCount = 0;

  records.forEach(r => {
    const values = Object.values(r);
    if (values.some(v => v === null || v === undefined || v === '')) missingCount++;
    if (outlierCheck(r)) outlierCount++;
  });

  const missingRate = recordCount > 0 ? Math.round((missingCount / recordCount) * 1000) / 10 : 0;
  const outlierRate = recordCount > 0 ? Math.round((outlierCount / recordCount) * 1000) / 10 : 0;
  const completeness = Math.max(0, 100 - missingRate);

  return {
    fieldName: name,
    recordCount,
    missingCount,
    missingRate,
    outlierCount,
    outlierRate,
    completeness,
    hasOutliers: outlierCount > 0,
    sampleSize: recordCount
  };
}

export function getDataQualityReport(filter: FilterParams = {}): DataQualityReport {
  const tickets = filterByTime(dataStore.tickets, filter.startTime, filter.endTime)
    .filter(t => !filter.activity?.length || filter.activity.includes(t.activity));
  const gates = filterByTime(dataStore.gates, filter.startTime, filter.endTime)
    .filter(g => !filter.activity?.length || filter.activity.includes(g.activity));
  const consumptions = filterByTime(dataStore.consumptions, filter.startTime, filter.endTime)
    .filter(c => !filter.activity?.length || filter.activity.includes(c.activity));
  const parkings = filterByTime(dataStore.parkings, filter.startTime, filter.endTime)
    .filter(p => !filter.activity?.length || filter.activity.includes(p.activity));
  const weathers = filterByTime(dataStore.weathers, filter.startTime, filter.endTime);
  const shows = filterByTime(dataStore.shows, filter.startTime, filter.endTime)
    .filter(s => !filter.activity?.length || filter.activity.includes(s.activity));

  const ticketStats = calcSourceStats('门票数据', tickets, (r) => r.price < 0 || r.price > 2000);
  const gateStats = calcSourceStats('闸机数据', gates, (r) => r.queueDuration > 120 || r.queueDuration < 0);
  const consumptionStats = calcSourceStats('消费数据', consumptions, (r) => r.amount > 2000 || r.amount < 0);
  const parkingStats = calcSourceStats('停车数据', parkings, (r) => (r.duration ?? 0) > 720 || (r.fee ?? 0) < 0);
  const weatherStats = calcSourceStats('天气数据', weathers, (r) => r.temperature < -20 || r.temperature > 50 || r.humidity < 0 || r.humidity > 100);
  const showStats = calcSourceStats('演出数据', shows, (r) => r.audienceCount > r.capacity || r.audienceCount < 0);

  const allStats = [ticketStats, gateStats, consumptionStats, parkingStats, weatherStats, showStats];
  const totalRecords = allStats.reduce((s, st) => s + st.recordCount, 0);
  const totalMissing = allStats.reduce((s, st) => s + st.missingCount, 0);
  const totalOutliers = allStats.reduce((s, st) => s + st.outlierCount, 0);
  const cleanedRecords = totalMissing + totalOutliers;

  const missingRate = totalRecords > 0 ? Math.round((totalMissing / totalRecords) * 1000) / 10 : 0;

  return {
    missingRate,
    outlierCount: totalOutliers,
    sampleSize: totalRecords,
    updatedAt: dataStore.lastUpdate.toISOString(),
    caliberVersion: CALIBER_VERSION,
    cleanedCount: cleanedRecords,
    fieldStats: allStats
  };
}
