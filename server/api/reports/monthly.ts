import { getMonthlyReport } from '~/server/utils/mockData'
import { useFluctuationsStore } from '~/server/utils/fluctuationsStore'
import type { MonthlyReport, Fluctuation } from '~/types'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const month = query.month as string || new Date().toISOString().slice(0, 7)

  const baseReport = getMonthlyReport(month)
  const allFluctuations = useFluctuationsStore()

  const monthFluctuations = allFluctuations.filter((f: Fluctuation) => {
    if (!f.detectedAt) return false
    return f.detectedAt.startsWith(month)
  })

  const apiErrorList = monthFluctuations.filter((f: Fluctuation) => f.source === 'api_error')
  const apiErrorCount = apiErrorList.length
  const apiErrorClosed = apiErrorList.filter((f: Fluctuation) => f.status === 'closed').length

  const endpointMap = new Map<string, number>()
  for (const f of apiErrorList) {
    const endpoint = extractEndpointFromTitle(f.title, f.description)
    endpointMap.set(endpoint, (endpointMap.get(endpoint) || 0) + 1)
  }
  const apiErrorByEndpoint = Array.from(endpointMap.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)

  const dynamicTotal = monthFluctuations.length
  const dynamicClosed = monthFluctuations.filter((f: Fluctuation) => f.status === 'closed').length

  const enhanced: MonthlyReport & {
    apiErrorFluctuationCount: number
    apiErrorClosedCount: number
    apiErrorByEndpoint: { endpoint: string; count: number }[]
  } = {
    ...baseReport,
    fluctuationCount: Math.max(baseReport.fluctuationCount, dynamicTotal),
    closedFluctuations: Math.max(baseReport.closedFluctuations, dynamicClosed),
    apiErrorFluctuationCount: apiErrorCount,
    apiErrorClosedCount: apiErrorClosed,
    apiErrorByEndpoint
  }

  return enhanced
})

function extractEndpointFromTitle(title: string, description?: string): string {
  const titleMatch = title.match(/接口异常:\s*(\S+)\s/)
  if (titleMatch) return titleMatch[1]

  if (title.includes('库存') || (description || '').includes('库存')) return '库存查询接口'
  if (title.includes('物流') || (description || '').includes('物流')) return '物流轨迹接口'
  if (title.includes('订单') || (description || '').includes('订单')) return '订单同步接口'
  if (title.includes('供应链') || (description || '').includes('供应链')) return '供应链系统接口'

  const descMatch = (description || '').match(/接口\s*(\S+?)\s*调用/)
  if (descMatch) return descMatch[1] + '接口'

  return '其他接口'
}
