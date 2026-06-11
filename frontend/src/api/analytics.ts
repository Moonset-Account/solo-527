import { get } from '@/utils/request'

export interface OrderStatusStats {
  status: string
  count: number
}

export interface ServiceTypeStats {
  serviceId: string
  serviceName: string
  count: number
  amount: number
}

export interface WorkerPerformance {
  workerId: string
  workerName: string
  totalOrders: number
  completedOrders: number
  onTimeRate: number
  avgRating: number
  totalAmount: number
  rescheduleCount: number
}

export interface CommunityStats {
  community: string
  orderCount: number
  amount: number
}

export interface TimeSeriesPoint {
  date: string
  orderCount: number
  amount: number
  onTimeRate: number
}

export interface OverallStats {
  totalOrders: number
  totalAmount: number
  avgOrderAmount: number
  onTimeRate: number
  avgRating: number
  activeWorkers: number
  newUsers: number
  cancelRate: number
  totalOrdersMom: number
  onTimeRateMom: number
  cancelRateMom: number
  avgRatingMom: number
}

export interface QueryAnalyticsParams {
  startTime?: string
  endTime?: string
  community?: string
  communities?: string[]
  workerId?: string
  dimension?: 'community' | 'date' | 'reason' | 'all'
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

export interface HeatmapItem {
  community: string
  serviceCategory: string
  orderCount: number
  supplyGap: number
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

export interface TrendPoint {
  date: string
  orderCount: number
  onTimeRate: number
}

export function getOverallStats(params?: QueryAnalyticsParams) {
  return get<OverallStats>('/analytics/overall', params)
}

export function getOrderStatusStats(params?: QueryAnalyticsParams) {
  return get<OrderStatusStats[]>('/analytics/order-status', params)
}

export function getServiceTypeStats(params?: QueryAnalyticsParams) {
  return get<ServiceTypeStats[]>('/analytics/service-type', params)
}

export function getWorkerPerformance(params?: QueryAnalyticsParams) {
  return get<WorkerPerformance[]>('/analytics/worker-performance', params)
}

export function getCommunityStats(params?: QueryAnalyticsParams) {
  return get<CommunityStats[]>('/analytics/community', params)
}

export function getOrderTrend(params?: QueryAnalyticsParams) {
  return get<TimeSeriesPoint[]>('/analytics/order-trend', params)
}

export function getRevenueTrend(params?: QueryAnalyticsParams) {
  return get<TimeSeriesPoint[]>('/analytics/revenue-trend', params)
}

export function getSupplyDemandStats(params?: QueryAnalyticsParams) {
  return get<Record<string, number>>('/analytics/supply-demand', params)
}

export function getFulfillmentBreakdown(params?: QueryAnalyticsParams) {
  return get<FulfillmentBreakdownItem[]>('/analytics/fulfillment-breakdown', params)
}

export function getHeatmapData(params?: QueryAnalyticsParams) {
  return get<HeatmapItem[]>('/analytics/heatmap', params)
}

export function getWorkerRanking(params?: QueryAnalyticsParams) {
  return get<WorkerRankItem[]>('/analytics/worker-ranking', params)
}

export function getTrendAnalysis(params?: QueryAnalyticsParams) {
  return get<TrendPoint[]>('/analytics/trend', params)
}
