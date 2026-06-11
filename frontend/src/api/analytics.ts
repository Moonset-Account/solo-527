import { get } from '@/utils/request'

export interface OverallStats {
  totalOrders: number
  completedOrders?: number
  cancelledOrders?: number
  rescheduledCount?: number
  totalAmount: number
  avgOrderAmount: number
  onTimeRate: number
  onTimeBreakdown?: any
  avgRating: number
  averageRating?: number
  reviewCount?: number
  activeWorkers: number
  newUsers: number
  todayOrders?: number
  inProgressOrders?: number
  cancelRate: number
  totalOrdersMom: number
  onTimeRateMom: number
  cancelRateMom: number
  avgRatingMom: number
}

export interface OverviewParams {
  startDate?: string
  endDate?: string
}

export interface FulfillmentBreakdownItem {
  group: string
  totalOrders: number
  onTimeOrders: number
  lateOrders: number
  onTimeRate: number
  scheduledOnTime: number
  arrivedOnTime: number
  completedOnTime: number
}

export interface OnTimeParams {
  groupBy?: 'community' | 'date' | 'reason' | 'all'
  startDate?: string
  endDate?: string
  communities?: string
}

export interface HeatmapItem {
  community: string
  serviceCategory: string
  orderCount: number
  supplyGap: number
}

export interface RegionDemandParams {
  startDate?: string
  endDate?: string
  communities?: string
  categories?: string
}

export interface WorkerRankItem {
  rank: number
  workerId: string
  workerName: string
  completedOrders: number
  onTimeRate: number
  avgRating: number
  rescheduleCount: number
}

export interface WorkerRankListResult {
  data: WorkerRankItem[]
  total: number
  page: number
  pageSize: number
}

export interface WorkersParams {
  startDate?: string
  endDate?: string
  sortBy?: 'completed' | 'onTimeRate' | 'rating' | 'reschedule'
  page?: number
  pageSize?: number
}

export interface TrendPoint {
  date: string
  orderCount: number
  onTimeRate: number
}

export interface TrendParams {
  granularity?: 'day' | 'week' | 'month'
  startDate?: string
  endDate?: string
}

export function getOverview(params?: OverviewParams) {
  return get<OverallStats>('/analytics/overview', params)
}

export function getOnTimeBreakdown(params?: OnTimeParams) {
  return get<FulfillmentBreakdownItem[]>('/analytics/ontime', params)
}

export function getRegionDemand(params?: RegionDemandParams) {
  return get<HeatmapItem[]>('/analytics/region-demand', params)
}

export function getTrend(params?: TrendParams) {
  return get<TrendPoint[]>('/analytics/trend', params)
}

export function getWorkerRanking(params?: WorkersParams) {
  return get<WorkerRankListResult>('/analytics/workers', params)
}
