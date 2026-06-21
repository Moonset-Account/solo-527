import { get } from '../http'

export interface SummaryData {
  totalCalls: number
  hitRate: number
  avgCost: number
  rejectionRate: number
  totalCallsMom: number
  hitRateMom: number
  avgCostMom: number
  rejectionRateMom: number
  callsTrend?: [number, number][]
}

export async function getSummaryApi(params?: { startDate?: string; endDate?: string }): Promise<SummaryData> {
  const data = await get<any>('/analytics/summary', params)
  return {
    totalCalls: data.totalCalls ?? 0,
    hitRate: data.hitRate ?? 0,
    avgCost: data.avgCost ?? 0,
    rejectionRate: data.rejectionRate ?? 0,
    totalCallsMom: data.totalCallsMom ?? 0,
    hitRateMom: data.hitRateMom ?? 0,
    avgCostMom: data.avgCostMom ?? 0,
    rejectionRateMom: data.rejectionRateMom ?? 0,
    callsTrend: data.callsTrend,
  }
}

export interface HitRatePoint { date: string; rate: number; total: number }

export async function getHitRateApi(days = 30): Promise<HitRatePoint[]> {
  const data = await get<any>('/analytics/hit-rate', { days })
  const dates = data.dates || []
  const rates = data.rates || []
  const totals = data.totals || []
  return dates.map((d: string, i: number) => ({
    date: d,
    rate: rates[i] || 0,
    total: totals[i] || 0,
  }))
}

export interface CostBreakdownItem {
  date?: string
  userId?: number
  userName?: string
  reviewerId?: number
  reviewerName?: string
  rejectReasonCode?: string
  rejectReasonName?: string
  approvedCost: number
  rejectedCost: number
  usedCost: number
  totalCost: number
  approvedCount: number
  rejectedCount: number
  usedCount: number
}

export async function getCostBreakdownApi(
  dimension: 'date' | 'user' | 'reviewer' | 'reason',
  params?: { startDate?: string; endDate?: string }
): Promise<CostBreakdownItem[]> {
  const data = await get<any>('/analytics/cost-breakdown', { dimension, ...params })
  const items = data?.items || data || []
  return items.map((it: any) => ({
    date: it.date,
    userId: it.userId,
    userName: it.userName,
    reviewerId: it.reviewerId,
    reviewerName: it.reviewerName,
    rejectReasonCode: it.rejectReasonCode,
    rejectReasonName: it.rejectReasonName,
    approvedCost: it.approvedCost ?? 0,
    rejectedCost: it.rejectedCost ?? 0,
    usedCost: it.usedCost ?? 0,
    totalCost: it.totalCost ?? 0,
    approvedCount: it.approvedCount ?? it.count ?? 0,
    rejectedCount: it.rejectedCount ?? 0,
    usedCount: it.usedCount ?? 0,
  }))
}

export interface RejectReasonItem { code: string; name: string; count: number; cost: number; percentage: number }

export async function getRejectReasonsApi(params?: { startDate?: string; endDate?: string }): Promise<RejectReasonItem[]> {
  const data = await get<any>('/analytics/reject-reasons', params)
  const arr = data || []
  return arr.map((it: any) => ({
    code: it.code || '',
    name: it.name || it.code || '',
    count: it.count ?? 0,
    cost: it.cost ?? 0,
    percentage: it.percentage ?? 0,
  }))
}

export interface VersionEffectItem { version: string; hitRate: number; avgCost: number; calls: number }

export async function getVersionEffectApi(): Promise<VersionEffectItem[]> {
  const data = await get<any>('/analytics/version-effect')
  const arr = data?.items || data || []
  return arr.map((it: any) => ({
    version: it.version || '',
    hitRate: it.hitRate ?? 0,
    avgCost: it.avgCost ?? 0,
    calls: it.calls ?? it.totalCalls ?? 0,
  }))
}

export async function getDashboardSummaryApi() {
  return getSummaryApi()
}

export async function getAnalyticsApi() {
  return {
    dailyStats: [],
    costStats: [],
    performance: {},
    categoryStats: [],
    riskStats: [],
    topTemplates: [],
    reviewerStats: [],
  }
}

export async function getDailyStatsApi() { return [] }
export async function getPerformanceMetricsApi() { return {} }
export async function getCategoryDistributionApi() { return [] }
export async function getRiskDistributionApi() { return [] }
export async function getCostStatsApi() { return [] }
export async function getTopTemplatesApi() { return [] }
export async function getReviewerStatsApi() { return [] }
export async function exportAnalyticsApi() { return { downloadUrl: '#' } }
