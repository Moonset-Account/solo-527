import { get } from '@/utils/request'

export interface OverallStats {
  totalOrders: number
  completedOrders?: number
  cancelledOrders?: number
  rescheduledCount?: number
  rescheduledOrders?: number
  totalRescheduleTimes?: number
  totalAmount?: number
  avgOrderAmount?: number
  onTimeRate: number
  overallOnTimeRate?: number
  onTimeBreakdown?: {
    scheduled: number
    arrived: number
    completed: number
  }
  onTimeRateBreakdown?: any
  avgRating: number
  averageRating?: number
  reviewCount?: number
  activeWorkers?: number
  newUsers?: number
  todayOrders?: number
  todayCount?: number
  inProgressOrders?: number
  inTransitOrders?: number
  cancelRate: number
  totalOrdersMom: number
  onTimeRateMom: number
  cancelRateMom: number
  avgRatingMom: number
  completedOrdersMom?: number
  dateRange?: {
    start: string
    end: string
  }
}

export interface OverviewParams {
  startDate?: string
  endDate?: string
}

export interface OnTimeNodeDetail {
  total: number
  onTime: number
  onTimeRate: number
}

export interface FulfillmentBreakdownGroup {
  group: { community?: string; date?: string; reason?: string; all?: boolean }
  total: number
  onTimeCount: number
  lateCount: number
  onTimeRate: number
  nodeBreakdown: {
    scheduled: OnTimeNodeDetail
    arrived: OnTimeNodeDetail
    completed: OnTimeNodeDetail
  }
  compare?: {
    totalDiff: number
    totalDiffRate: number
    onTimeRateDiff: number
    lateCountDiff: number
  }
}

export interface OnTimeBreakdownResult {
  summary: {
    totalGroups: number
    totalOrders: number
    avgOnTimeRate: number
    totalCompare: {
      totalDiff: number
      totalDiffRate: number
    }
  }
  groups: FulfillmentBreakdownGroup[]
  dateRange: {
    current: { start: string; end: string }
    previous: { start: string; end: string }
  }
  groupBy: 'community' | 'date' | 'reason' | 'all'
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

export interface RegionDemandItem {
  community: string
  category?: string
  timeSlot?: string
  name?: string
  orderCount: number
  completedCount: number
  cancelledCount: number
  completionRate: number
  availableWorkers?: number
  supplyCapacity?: number
  demandGap?: number
  demandGapStatus?: 'deficit' | 'balanced' | 'surplus'
}

export interface RegionDemandResult {
  summary: {
    totalOrders: number
    totalCapacity: number
    totalDemandGap: number
    totalAvailableWorkers: number
    daysCovered: number
    deficitCommunities: number
  }
  byCommunity: RegionDemandItem[]
  byCategory: RegionDemandItem[]
  byTimeSlot: RegionDemandItem[]
  details: RegionDemandItem[]
  dateRange: {
    start: string
    end: string
  }
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
  data?: WorkerRankItem[]
  list?: WorkerRankItem[]
  total?: number
  page?: number
  pageSize?: number
  summary?: any
  topRankings?: any
  pagination?: any
}

export interface WorkersParams {
  startDate?: string
  endDate?: string
  sortBy?: 'completed' | 'onTimeRate' | 'rating' | 'reschedule'
  page?: number
  pageSize?: number
}

export interface TrendPoint {
  date?: string
  label?: string
  orderCount: number
  completedCount?: number
  cancelledCount?: number
  rescheduledCount?: number
  completionRate?: number
  revenue?: number
  totalRevenue?: number
  onTimeRate: number
  averageRating?: number
  reviewCount?: number
}

export interface TrendResult {
  granularity: 'day' | 'week' | 'month'
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOnTimeRate: number
    avgCompletionRate: number
    periodGrowth?: {
      orderGrowth?: number
      revenueGrowth?: number
      onTimeRateDiff?: number
    }
  }
  dataPoints: TrendPoint[]
  dateRange: {
    start: string
    end: string
  }
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
  return get<OnTimeBreakdownResult>('/analytics/ontime', params)
}

export function getRegionDemand(params?: RegionDemandParams) {
  return get<RegionDemandResult>('/analytics/region-demand', params)
}

export function getTrend(params?: TrendParams) {
  return get<TrendResult>('/analytics/trend', params)
}

export function getWorkerRanking(params?: WorkersParams) {
  return get<WorkerRankListResult>('/analytics/workers', params)
}
