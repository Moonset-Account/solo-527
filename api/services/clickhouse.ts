import { getDemoDataset } from './demoData.js';
import type { VisitorRecord } from './demoData.js';

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  enterpriseIds?: string[];
  gateIds?: string[];
  visitorTypes?: string[];
  laneIds?: string[];
}

function applyFilters(records: VisitorRecord[], params: FilterParams): VisitorRecord[] {
  return records.filter(r => {
    if (params.startDate) {
      const startTs = new Date(params.startDate).getTime();
      if (r.passTimestamp < startTs) return false;
    }
    if (params.endDate) {
      const endTs = new Date(params.endDate).getTime();
      if (r.passTimestamp > endTs) return false;
    }
    if (params.enterpriseIds?.length && !params.enterpriseIds.includes(r.enterpriseId)) return false;
    if (params.gateIds?.length && !params.gateIds.includes(r.gateId)) return false;
    if (params.visitorTypes?.length && !params.visitorTypes.includes(r.visitorType)) return false;
    if (params.laneIds?.length && !params.laneIds.includes(r.laneId)) return false;
    return true;
  });
}

function alignToHour(ts: number): number {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function alignToDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface OverviewResult {
  totalVisitors: number;
  totalAbnormal: number;
  abnormalRate: number;
  peakHour: string;
  peakVisitorCount: number;
  abnormalEvents: Array<{
    id: string;
    level: 'critical' | 'warning' | 'info';
    time: string;
    description: string;
    hasRemark: boolean;
    gateName: string;
    enterpriseName: string;
  }>;
}

export async function queryOverview(params: FilterParams): Promise<OverviewResult> {
  const { records } = getDemoDataset();
  const filtered = applyFilters(records, params);

  const totalVisitors = filtered.length;
  const abnormalRecords = filtered.filter(r => r.isAbnormal);
  const totalAbnormal = abnormalRecords.length;
  const abnormalRate = totalVisitors > 0 ? (totalAbnormal / totalVisitors) * 100 : 0;

  const hourCounts: Record<number, number> = {};
  for (const r of filtered) {
    const h = alignToHour(r.passTimestamp);
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }

  let peakHour = 0;
  let peakVisitorCount = 0;
  for (const [h, count] of Object.entries(hourCounts)) {
    if (count > peakVisitorCount) {
      peakHour = new Date(parseInt(h)).getHours();
      peakVisitorCount = count;
    }
  }

  const abnormalEvents = abnormalRecords
    .sort((a, b) => b.passTimestamp - a.passTimestamp)
    .slice(0, 10)
    .map(r => ({
      id: r.id,
      level: r.abnormalLevel || 'warning',
      time: r.passTime,
      description: r.abnormalReason || '异常放行',
      hasRemark: !!r.remark,
      gateName: r.gateName,
      enterpriseName: r.enterpriseName,
    }));

  return {
    totalVisitors,
    totalAbnormal,
    abnormalRate: Math.round(abnormalRate * 100) / 100,
    peakHour: `${peakHour.toString().padStart(2, '0')}:00`,
    peakVisitorCount,
    abnormalEvents,
  };
}

export interface HeatmapPoint {
  gateId: string;
  gateName: string;
  hour: number;
  count: number;
}

export async function queryHeatmap(params: FilterParams): Promise<HeatmapPoint[]> {
  const { records } = getDemoDataset();
  const filtered = applyFilters(records, params);

  const matrix: Record<string, HeatmapPoint> = {};

  for (const r of filtered) {
    const hour = new Date(r.passTime).getHours();
    const key = `${r.gateId}-${hour}`;
    if (!matrix[key]) {
      matrix[key] = {
        gateId: r.gateId,
        gateName: r.gateName,
        hour,
        count: 0,
      };
    }
    matrix[key].count++;
  }

  return Object.values(matrix);
}

export interface RankItem {
  enterpriseId: string;
  enterpriseName: string;
  total: number;
  abnormal: number;
  abnormalRate: number;
  rank: number;
}

export async function queryRank(
  params: FilterParams,
  sortBy: 'total' | 'abnormal' = 'total',
  limit: number = 10
): Promise<RankItem[]> {
  const { records } = getDemoDataset();
  const filtered = applyFilters(records, params);

  const enterpriseMap: Record<string, { total: number; abnormal: number; name: string }> = {};

  for (const r of filtered) {
    if (!enterpriseMap[r.enterpriseId]) {
      enterpriseMap[r.enterpriseId] = {
        total: 0,
        abnormal: 0,
        name: r.enterpriseName,
      };
    }
    enterpriseMap[r.enterpriseId].total++;
    if (r.isAbnormal) {
      enterpriseMap[r.enterpriseId].abnormal++;
    }
  }

  const items: RankItem[] = Object.entries(enterpriseMap)
    .map(([id, data]) => ({
      enterpriseId: id,
      enterpriseName: data.name,
      total: data.total,
      abnormal: data.abnormal,
      abnormalRate: data.total > 0 ? Math.round((data.abnormal / data.total) * 10000) / 100 : 0,
      rank: 0,
    }))
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, limit)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return items;
}

export interface ExceptionItem {
  id: string;
  time: string;
  plateNumber: string;
  idCard: string;
  visitorType: string;
  gateName: string;
  lane: string;
  enterpriseName: string;
  reason: string;
  level: 'critical' | 'warning' | 'info';
  remark?: string;
  operator?: string;
}

export interface ExceptionListResult {
  total: number;
  list: ExceptionItem[];
}

export async function queryExceptions(
  params: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<ExceptionListResult> {
  const { records } = getDemoDataset();
  const filtered = applyFilters(records, params).filter(r => r.isAbnormal);
  const total = filtered.length;

  const start = (page - 1) * pageSize;
  const pageData = filtered
    .sort((a, b) => b.passTimestamp - a.passTimestamp)
    .slice(start, start + pageSize)
    .map(r => ({
      id: r.id,
      time: r.passTime,
      plateNumber: r.plateNumber,
      idCard: r.idCard,
      visitorType: r.visitorTypeName,
      gateName: r.gateName,
      lane: r.laneName,
      enterpriseName: r.enterpriseName,
      reason: r.abnormalReason || '',
      level: r.abnormalLevel || 'warning',
      remark: r.remark,
      operator: r.operator,
    }));

  return { total, list: pageData };
}

export interface TrendPoint {
  time: string;
  timestamp: number;
  count: number;
  abnormal: number;
  isMissing: boolean;
  isPeak: boolean;
  remark?: string;
}

export async function queryTrend(
  params: FilterParams,
  granularity: 'hour' | 'day' = 'hour'
): Promise<TrendPoint[]> {
  const { records, summary } = getDemoDataset();
  const filtered = applyFilters(records, params);

  if (filtered.length === 0) return [];

  const bucketMs = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const alignFn = granularity === 'hour' ? alignToHour : alignToDay;

  const minTs = alignFn(Math.min(...filtered.map(r => r.passTimestamp)));
  const maxTs = alignFn(Math.max(...filtered.map(r => r.passTimestamp)));

  const dataMap: Record<number, { count: number; abnormal: number; remark?: string }> = {};

  for (const r of filtered) {
    const bucket = alignFn(r.passTimestamp);
    if (!dataMap[bucket]) {
      dataMap[bucket] = { count: 0, abnormal: 0 };
    }
    dataMap[bucket].count++;
    if (r.isAbnormal) dataMap[bucket].abnormal++;
    if (r.remark && !dataMap[bucket].remark) {
      dataMap[bucket].remark = '存在人工备注';
    }
  }

  const missingTimestamps = new Set<number>();
  for (const missingIso of summary.missingHours) {
    missingTimestamps.add(alignToHour(new Date(missingIso).getTime()));
  }

  const points: TrendPoint[] = [];
  for (let t = minTs; t <= maxTs; t += bucketMs) {
    const bucketData = dataMap[t];
    const isMissing = missingTimestamps.has(t) || (!bucketData && granularity === 'hour');
    
    points.push({
      time: new Date(t).toISOString(),
      timestamp: t,
      count: bucketData?.count || 0,
      abnormal: bucketData?.abnormal || 0,
      isMissing: !!isMissing,
      isPeak: false,
      remark: bucketData?.remark,
    });
  }

  const counts = points.filter(p => !p.isMissing).map(p => p.count);
  if (counts.length > 0) {
    const maxCount = Math.max(...counts);
    const peakThreshold = maxCount * 0.7;
    for (const p of points) {
      if (!p.isMissing && p.count >= peakThreshold && p.count > 0) {
        p.isPeak = true;
      }
    }
  }

  return points;
}

export async function updateRemark(recordId: string, remark: string): Promise<boolean> {
  const { records } = getDemoDataset();
  const record = records.find(r => r.id === recordId);
  if (record) {
    record.remark = remark;
    return true;
  }
  return false;
}

export async function getExportData(params: FilterParams): Promise<VisitorRecord[]> {
  const { records } = getDemoDataset();
  return applyFilters(records, params);
}

export interface DimensionData {
  enterprises: Array<{ id: string; name: string }>;
  gates: Array<{ id: string; name: string }>;
  lanes: Array<{ id: string; name: string; gateId: string }>;
  visitorTypes: Array<{ id: string; name: string }>;
}

export function getDimensions(): DimensionData {
  const config = getDemoDataset();
  const enterpriseSet = new Map<string, string>();
  const gateSet = new Map<string, string>();
  const laneSet = new Map<string, { name: string; gateId: string }>();
  const visitorTypeSet = new Map<string, string>();

  for (const r of config.records) {
    enterpriseSet.set(r.enterpriseId, r.enterpriseName);
    gateSet.set(r.gateId, r.gateName);
    laneSet.set(r.laneId, { name: r.laneName, gateId: r.gateId });
    visitorTypeSet.set(r.visitorType, r.visitorTypeName);
  }

  return {
    enterprises: Array.from(enterpriseSet, ([id, name]) => ({ id, name })),
    gates: Array.from(gateSet, ([id, name]) => ({ id, name })),
    lanes: Array.from(laneSet, ([id, data]) => ({ id, name: data.name, gateId: data.gateId })),
    visitorTypes: Array.from(visitorTypeSet, ([id, name]) => ({ id, name })),
  };
}
