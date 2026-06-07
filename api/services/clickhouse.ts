import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { getDemoDataset } from './demoData.js';
import type { VisitorRecord } from './demoData.js';

export const CLICKHOUSE_MODE = (process.env.CLICKHOUSE_MODE || 'memory') as 'memory' | 'clickhouse';

const CLICKHOUSE_CONFIG = {
  host: process.env.CLICKHOUSE_HOST || 'localhost',
  port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
  database: process.env.CLICKHOUSE_DATABASE || 'park_security',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
};

let chClient: ClickHouseClient | null = null;

if (CLICKHOUSE_MODE === 'clickhouse') {
  try {
    chClient = createClient({
      host: CLICKHOUSE_CONFIG.host,
      port: CLICKHOUSE_CONFIG.port,
      database: CLICKHOUSE_CONFIG.database,
      username: CLICKHOUSE_CONFIG.username,
      password: CLICKHOUSE_CONFIG.password,
    });
    console.log(`[ClickHouse] Connected in CLICKHOUSE_MODE:', CLICKHOUSE_MODE);
  } catch (e) {
    console.warn('[ClickHouse] Connection failed, falling back to memory mode');
  }
} else {
  console.log('[ClickHouse] Running in memory mode');
}

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

function getGlobalMissingHours(): Set<number> {
  const { summary } = getDemoDataset();
  const missing = new Set<number>();
  for (const iso of summary.missingHours) {
    missing.add(alignToHour(new Date(iso).getTime()));
  }
  return missing;
}

function hasGlobalDataAtHour(hourTs: number): boolean {
  const { records } = getDemoDataset();
  return records.some(r => alignToHour(r.passTimestamp) === hourTs);
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

async function queryOverviewMemory(params: FilterParams): Promise<OverviewResult> {
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

async function queryOverviewClickHouse(params: FilterParams): Promise<OverviewResult> {
  return queryOverviewMemory(params);
}

export async function queryOverview(params: FilterParams): Promise<OverviewResult> {
  if (CLICKHOUSE_MODE === 'clickhouse' && chClient) {
    return queryOverviewClickHouse(params);
  }
  return queryOverviewMemory(params);
}

export interface HeatmapPoint {
  gateId: string;
  gateName: string;
  hour: number;
  count: number;
}

async function queryHeatmapMemory(params: FilterParams): Promise<HeatmapPoint[]> {
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

export async function queryHeatmap(params: FilterParams): Promise<HeatmapPoint[]> {
  if (CLICKHOUSE_MODE === 'clickhouse' && chClient) {
    return queryHeatmapMemory(params);
  }
  return queryHeatmapMemory(params);
}

export interface RankItem {
  enterpriseId: string;
  enterpriseName: string;
  total: number;
  abnormal: number;
  abnormalRate: number;
  rank: number;
}

async function queryRankMemory(
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

export async function queryRank(
  params: FilterParams,
  sortBy: 'total' | 'abnormal' = 'total',
  limit: number = 10
): Promise<RankItem[]> {
  if (CLICKHOUSE_MODE === 'clickhouse' && chClient) {
    return queryRankMemory(params, sortBy, limit);
  }
  return queryRankMemory(params, sortBy, limit);
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

async function queryExceptionsMemory(
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

export async function queryExceptions(
  params: FilterParams,
  page: number = 1,
  pageSize: number = 20
): Promise<ExceptionListResult> {
  if (CLICKHOUSE_MODE === 'clickhouse' && chClient) {
    return queryExceptionsMemory(params, page, pageSize);
  }
  return queryExceptionsMemory(params, page, pageSize);
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

async function queryTrendMemory(
  params: FilterParams,
  granularity: 'hour' | 'day' = 'hour'
): Promise<TrendPoint[]> {
  const { records } = getDemoDataset();
  const filtered = applyFilters(records, params);

  const globalMissing = getGlobalMissingHours();

  if (filtered.length === 0) return [];

  const bucketMs = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const alignFn = granularity === 'hour' ? alignToHour : alignToDay;

  const allTs = records.map(r => alignFn(r.passTimestamp));
  const minTs = alignFn(Math.min(...allTs));
  const maxTs = alignFn(Math.max(...allTs));

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

  const points: TrendPoint[] = [];
  for (let t = minTs; t <= maxTs; t += bucketMs) {
    const bucketData = dataMap[t];
    const isGlobalMissing = granularity === 'hour' && globalMissing.has(t);
    const count = bucketData?.count || 0;
    const abnormal = bucketData?.abnormal || 0;
    
    points.push({
      time: new Date(t).toISOString(),
      timestamp: t,
      count,
      abnormal,
      isMissing: isGlobalMissing,
      isPeak: false,
      remark: bucketData?.remark,
    });
  }

  const counts = points.filter(p => !p.isMissing && p.count > 0).map(p => p.count);
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

export async function queryTrend(
  params: FilterParams,
  granularity: 'hour' | 'day' = 'hour'
): Promise<TrendPoint[]> {
  if (CLICKHOUSE_MODE === 'clickhouse' && chClient) {
    return queryTrendMemory(params, granularity);
  }
  return queryTrendMemory(params, granularity);
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

export function getClickHouseClient(): ClickHouseClient | null {
  return chClient;
}
