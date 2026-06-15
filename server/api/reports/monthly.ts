import { getMonthlyReport, getFluctuations } from '~/server/utils/mockData'
import type { MonthlyReport } from '~/types'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const month = query.month as string || new Date().toISOString().slice(0, 7)

  const baseReport = getMonthlyReport(month)

  const allFluctuations = getFluctuations()
  const monthFluctuations = allFluctuations.filter(f => {
    if (!f.detectedAt) return false
    return f.detectedAt.startsWith(month)
  })

  const apiErrorCount = monthFluctuations.filter(f => f.source === 'api_error').length
  const apiErrorClosed = monthFluctuations.filter(f => f.source === 'api_error' && f.status === 'closed').length

  const enhanced: MonthlyReport & {
    apiErrorFluctuationCount: number
    apiErrorClosedCount: number
    apiErrorByEndpoint: { endpoint: string; count: number }[]
  } = {
    ...baseReport,
    apiErrorFluctuationCount: apiErrorCount,
    apiErrorClosedCount: apiErrorClosed,
    apiErrorByEndpoint: [
      { endpoint: '库存查询接口', count: 2 },
      { endpoint: '物流轨迹接口', count: 2 },
      { endpoint: '订单同步接口', count: 1 }
    ]
  }

  return enhanced
})
