import { getMetricsOverview, getMetricsTrend } from '~/server/utils/mockData'
import { cacheGet, cacheSet } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const timeRange = query.timeRange as string || 'month'
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const cacheKey = `metrics:overview:${timeRange}:${startDate || ''}:${endDate || ''}`
  const cached = await cacheGet(cacheKey)
  
  if (cached) {
    return cached
  }

  const data = getMetricsOverview()
  await cacheSet(cacheKey, data, 300)

  return data
})
