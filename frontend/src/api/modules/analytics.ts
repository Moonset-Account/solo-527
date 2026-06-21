import { get } from '../http'
import type { AnalyticsData, DashboardSummary, DailyStats } from '@/types'
import { mockAnalytics, mockResponse } from '@/mock/data'

export async function getDashboardSummaryApi(): Promise<DashboardSummary> {
  return mockResponse<DashboardSummary>({
    totalEmailsToday: 128,
    pendingReviews: 23,
    highRiskCount: 5,
    sentToday: 89,
    aiAccuracyRate: 94.7,
    averageReviewTime: 3.2
  }, 300)
}

export async function getAnalyticsApi(params?: {
  startDate?: string
  endDate?: string
  granularity?: 'day' | 'week' | 'month'
}): Promise<AnalyticsData> {
  return mockResponse<AnalyticsData>(mockAnalytics, 400)
}

export async function getDailyStatsApi(params?: {
  startDate?: string
  endDate?: string
}): Promise<DailyStats[]> {
  return mockResponse<DailyStats[]>(mockAnalytics.dailyStats, 300)
}

export async function getPerformanceMetricsApi(): Promise<AnalyticsData['performance']> {
  return mockResponse(mockAnalytics.performance, 300)
}

export async function getCategoryDistributionApi(): Promise<AnalyticsData['categoryStats']> {
  return mockResponse(mockAnalytics.categoryStats, 300)
}

export async function getRiskDistributionApi(): Promise<AnalyticsData['riskStats']> {
  return mockResponse(mockAnalytics.riskStats, 300)
}

export async function getCostStatsApi(params?: {
  startDate?: string
  endDate?: string
}): Promise<AnalyticsData['costStats']> {
  return mockResponse(mockAnalytics.costStats, 300)
}

export async function getTopTemplatesApi(limit = 10): Promise<AnalyticsData['topTemplates']> {
  return mockResponse(mockAnalytics.topTemplates.slice(0, limit), 300)
}

export async function getReviewerStatsApi(): Promise<AnalyticsData['reviewerStats']> {
  return mockResponse(mockAnalytics.reviewerStats, 300)
}

export async function exportAnalyticsApi(params: {
  startDate: string
  endDate: string
  type: string
}): Promise<{ downloadUrl: string }> {
  return mockResponse({
    downloadUrl: `/download/analytics_${params.type}_${params.startDate}_${params.endDate}.xlsx`
  }, 800)
}
