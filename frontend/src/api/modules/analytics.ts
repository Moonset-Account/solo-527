import { get } from '../http'
import type { CostDimension } from '@/types'

export interface MetricNode {
  current: number
  previous: number
  mom: number
  trend: 'up' | 'down' | 'flat'
  unit?: string
}

export interface SummaryData {
  totalCalls: MetricNode
  hitRate: MetricNode & { unit: '%' }
  avgCost: MetricNode & { unit: string }
  rejectRate: MetricNode & { unit: '%' }
  totalCost: MetricNode & { unit: string }
}

export interface HitRateData {
  days: number
  overallHitRate: number
  totalCalls: number
  totalApproved: number
  trend: Array<{ date: string; total: number; approved: number; hitRate: number }>
}

export interface CostBreakdownItem {
  key: string
  label: string
  totalCost: number
  totalTokens: number
  callCount: number
  avgCost: number
}

export interface CostBreakdownData {
  dimension: CostDimension
  dimensionLabel: string
  items: CostBreakdownItem[]
}

export interface RejectReasonItem {
  code: string
  name: string
  category: string
  count: number
  percentage: number
}

export interface RejectReasonsData {
  totalCount: number
  items: RejectReasonItem[]
  categoryStats?: Record<string, { count: number; percentage: number }>
}

export interface VersionEffectItem {
  id: string | number
  version: string
  name?: string
  totalCalls: number
  hitRate: number
  avgCost: number
  totalCost: number
  createdAt?: string
}

export interface VersionEffectData {
  templateVersions: VersionEffectItem[]
  promptVersions: VersionEffectItem[]
  overall?: {
    avgHitRate: number
    totalCost: number
    totalCalls: number
  }
}

export interface AnalyticsExtraParams {
  startDate?: string
  endDate?: string
  userId?: string
}

export async function getSummaryApi(extra?: AnalyticsExtraParams): Promise<SummaryData> {
  const q: any = { ...(extra || {}) }
  const data = await get<any>('/analytics/summary', q)
  const wrap = (raw: any, fallbackUnit?: string): any => ({
    current: Number(raw?.current ?? 0),
    previous: Number(raw?.previous ?? 0),
    mom: Number(raw?.mom ?? 0),
    trend: (raw?.trend === 'up' || raw?.trend === 'down' || raw?.trend === 'flat') ? raw.trend : 'flat',
    unit: raw?.unit || fallbackUnit,
  })
  return {
    totalCalls: wrap(data?.totalCalls),
    hitRate: wrap(data?.hitRate, '%'),
    avgCost: wrap(data?.avgCost, 'USD'),
    rejectRate: wrap(data?.rejectRate, '%'),
    totalCost: wrap(data?.totalCost, 'USD'),
  }
}

export async function getHitRateApi(days = 30, extra?: AnalyticsExtraParams): Promise<HitRateData> {
  const q: any = { days, ...(extra || {}) }
  const data = await get<any>('/analytics/hit-rate', q)
  const trend: any[] = Array.isArray(data?.trend) ? data.trend : []
  return {
    days: Number(data?.days ?? days),
    overallHitRate: Number(data?.overallHitRate ?? data?.overall_hit_rate ?? 0),
    totalCalls: Number(data?.totalCalls ?? data?.total_calls ?? 0),
    totalApproved: Number(data?.totalApproved ?? data?.total_approved ?? 0),
    trend: trend.map(t => ({
      date: String(t.date ?? ''),
      total: Number(t.total ?? 0),
      approved: Number(t.approved ?? 0),
      hitRate: Number(t.hitRate ?? t.hit_rate ?? 0),
    })),
  }
}

export async function getCostBreakdownApi(
  dimension: CostDimension,
  extra?: AnalyticsExtraParams & { userId?: string; startDate?: string; endDate?: string }
): Promise<CostBreakdownData> {
  const q: any = { dimension, ...(extra || {}) }
  const data = await get<any>('/analytics/cost-breakdown', q)
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  const labelMap: Record<CostDimension, string> = {
    date: '日期',
    user: '销售人员',
    reviewer: '复核人员',
    reason: '驳回原因',
  }
  return {
    dimension: (data?.dimension as any) || dimension,
    dimensionLabel: data?.dimensionLabel || labelMap[dimension] || dimension,
    items: items.map(i => ({
      key: String(i.key ?? ''),
      label: String(i.label ?? i.key ?? ''),
      totalCost: Number(i.totalCost ?? i.total_cost ?? 0),
      totalTokens: Number(i.totalTokens ?? i.total_tokens ?? 0),
      callCount: Number(i.callCount ?? i.call_count ?? 0),
      avgCost: Number(i.avgCost ?? i.avg_cost ?? 0),
    })),
  }
}

export async function getRejectReasonsApi(extra?: AnalyticsExtraParams): Promise<RejectReasonsData> {
  const q: any = { ...(extra || {}) }
  const data = await get<any>('/analytics/reject-reasons', q)
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  return {
    totalCount: Number(data?.totalCount ?? data?.total_count ?? items.reduce((s, i) => s + Number(i.count ?? 0), 0)),
    items: items.map(i => ({
      code: String(i.code ?? ''),
      name: String(i.name ?? i.code ?? ''),
      category: String(i.category ?? ''),
      count: Number(i.count ?? 0),
      percentage: Number(i.percentage ?? 0),
    })),
    categoryStats: data?.categoryStats || undefined,
  }
}

export async function getVersionEffectApi(extra?: AnalyticsExtraParams): Promise<VersionEffectData> {
  const q: any = { ...(extra || {}) }
  const data = await get<any>('/analytics/version-effect', q)
  const tv = Array.isArray(data?.templateVersions) ? data.templateVersions : []
  const pv = Array.isArray(data?.promptVersions) ? data.promptVersions : []
  const mapItem = (i: any): VersionEffectItem => ({
    id: i.id ?? i.version ?? '',
    version: String(i.version ?? i.versionCode ?? ''),
    name: i.name || i.versionName || undefined,
    totalCalls: Number(i.totalCalls ?? i.total_calls ?? 0),
    hitRate: Number(i.hitRate ?? i.hit_rate ?? 0),
    avgCost: Number(i.avgCost ?? i.avg_cost ?? 0),
    totalCost: Number(i.totalCost ?? i.total_cost ?? 0),
    createdAt: i.createdAt || i.created_at,
  })
  return {
    templateVersions: tv.map(mapItem),
    promptVersions: pv.map(mapItem),
    overall: data?.overall || undefined,
  }
}
