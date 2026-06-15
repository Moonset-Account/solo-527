import { getMetricsTrend } from '~/server/utils/mockData'
import { cacheGet, cacheSet } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const metric = query.metric as string || 'sales_amount'
  const timeRange = query.timeRange as string || 'month'
  const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90

  const cacheKey = `metrics:trend:${metric}:${days}`
  const cached = await cacheGet(cacheKey)
  
  if (cached) {
    return cached
  }

  const data = getMetricsTrend(metric, days)
  await cacheSet(cacheKey, data, 300)

  return data
})
