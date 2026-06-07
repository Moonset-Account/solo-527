import { API_CONFIG, type ApiResponse, type ClickHouseQueryResult } from './config'
import { createQueryContext, type QueryContext } from '../query/queryContext'
import {
  generateCoreMetrics,
  generateCohortData,
  generateFunnelData,
  generatePriceTrend,
  generateStoreRank,
  generateMedicineComparison,
  generatePrescriptionRanges,
} from '../query/dataEngine'
import { getCurrentUser } from './auth'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

function generateRequestId(): string {
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

function parseParams(params?: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  if (!params) return result

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.join(',')
      } else {
        result[key] = String(value)
      }
    }
  })
  return result
}

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  let url = API_CONFIG.baseURL + endpoint
  const parsedParams = parseParams(params)
  const searchParams = new URLSearchParams(parsedParams)
  const queryString = searchParams.toString()
  if (queryString) {
    url += '?' + queryString
  }
  return url
}

function buildQueryContext(endpoint: string, params?: Record<string, unknown>): QueryContext {
  const user = getCurrentUser()
  const parsed = parseParams(params)

  return createQueryContext({
    storeIds: parsed.storeIds ? parsed.storeIds.split(',') : [],
    regionIds: parsed.regionIds ? parsed.regionIds.split(',') : [],
    chronicLabels: parsed.chronicLabels ? parsed.chronicLabels.split(',') : [],
    memberTiers: parsed.memberTier ? parsed.memberTier.split(',') : [],
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    activityId: parsed.activityId,
    granularity: parsed.granularity as QueryContext['granularity'],
    cohortPeriod: parsed.cohortPeriod as QueryContext['cohortPeriod'],
    retentionPeriods: parsed.retentionPeriods ? parseInt(parsed.retentionPeriods) : undefined,
    targetCategories: parsed.targetCategories ? parsed.targetCategories.split(',') : [],
    userRole: user?.role,
    userStoreId: user?.storeId,
    userRegionId: user?.regionId,
  })
}

function handleMockEndpoint(
  endpoint: string,
  params?: Record<string, unknown>
): ApiResponse<unknown> {
  const ctx = buildQueryContext(endpoint, params)
  const requestId = generateRequestId()

  console.log(`[API Mock] ${endpoint}`, {
    requestId,
    queryContext: ctx,
  })

  let data: unknown

  switch (endpoint) {
    case '/analytics/core-metrics':
      data = generateCoreMetrics(ctx)
      break
    case '/analytics/cohort':
      data = generateCohortData(ctx)
      break
    case '/analytics/funnel':
      data = generateFunnelData(ctx)
      break
    case '/analytics/price-trend':
      data = generatePriceTrend(ctx)
      break
    case '/analytics/store-rank':
      data = generateStoreRank(ctx)
      break
    case '/analytics/medicine-comparison':
      data = generateMedicineComparison(ctx)
      break
    case '/analytics/prescription-ranges':
      data = generatePrescriptionRanges(ctx)
      break
    default:
      data = null
  }

  const sampleSize = extractSampleSize(data)

  const result: ClickHouseQueryResult<unknown> = {
    data,
    sampleSize,
    lowSample: sampleSize < 10,
    queryId: 'ch_' + Date.now().toString(36),
    executionTime: 50 + Math.floor(Math.random() * 250),
    rowsRead: Math.floor(Math.random() * 2000000 + 100000),
    bytesRead: Math.floor(Math.random() * 200 * 1024 * 1024 + 10 * 1024 * 1024),
  }

  return {
    code: 0,
    message: 'success',
    data: result,
    requestId,
    timestamp: Date.now(),
  }
}

function extractSampleSize(data: unknown): number {
  if (Array.isArray(data)) {
    if (data.length === 0) return 0
    const first = data[0] as Record<string, unknown>
    if ('sampleSize' in first && typeof first.sampleSize === 'number') {
      return first.sampleSize
    }
    if ('cells' in first && Array.isArray(first.cells)) {
      const cells = first.cells as Array<{ sampleSize?: number }>
      if (cells[0]?.sampleSize) {
        return cells[0].sampleSize
      }
    }
    let total = 0
    data.forEach(item => {
      if (item && typeof item === 'object' && 'sampleSize' in item) {
        total += (item as { sampleSize: number }).sampleSize
      }
    })
    return Math.floor(total / Math.max(1, data.length))
  }
  return 100
}

export async function request<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, unknown> } = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options
  const requestId = generateRequestId()
  const url = buildUrl(endpoint, params)
  const user = getCurrentUser()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`
  }

  console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`, {
    requestId,
    userRole: user?.role,
    useMock: USE_MOCK,
  })

  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300))
    const mockResponse = handleMockEndpoint(endpoint, params)
    console.log(`[API Mock] Response ${endpoint}`, {
      requestId,
      sampleSize: (mockResponse.data as ClickHouseQueryResult<unknown>)?.sampleSize,
      lowSample: (mockResponse.data as ClickHouseQueryResult<unknown>)?.lowSample,
    })
    return mockResponse as ApiResponse<T>
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as ApiResponse<T>

    if (result.code !== 0) {
      throw new Error(result.message || 'API 请求失败')
    }

    console.log(`[API] Response ${endpoint}`, { requestId })
    return result
  } catch (error) {
    console.error(`[API] Error ${endpoint}`, { requestId, error })
    throw error
  }
}

export async function clickhouseQuery<T>(
  queryType: string,
  params: Record<string, unknown> = {}
): Promise<ClickHouseQueryResult<T>> {
  const user = getCurrentUser()
  const allParams = { ...params }

  if (user?.role === 'store_manager' && user.storeId) {
    allParams.storeIds = user.storeId
  }
  if (user?.role === 'region_operation' && user.regionId) {
    allParams.regionId = user.regionId
  }

  const endpointMapping: Record<string, string> = {
    coreMetrics: '/analytics/core-metrics',
    cohort: '/analytics/cohort',
    funnel: '/analytics/funnel',
    priceTrend: '/analytics/price-trend',
    storeRank: '/analytics/store-rank',
    medicineComparison: '/analytics/medicine-comparison',
    prescriptionRanges: '/analytics/prescription-ranges',
  }

  const endpoint = endpointMapping[queryType] || '/analytics/core-metrics'
  const response = await request<ClickHouseQueryResult<T>>(endpoint, {
    method: 'GET',
    params: allParams,
  })

  return response.data
}
