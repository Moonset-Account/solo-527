import { API_CONFIG, type ApiResponse, type ClickHouseQueryResult } from './config'
import { getCurrentUser } from './auth'

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
  })

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as ApiResponse<T>

    if (result.code !== 0) {
      throw new Error(result.message || 'API 请求失败')
    }

    console.log(`[API] Response ${endpoint}`, {
      requestId,
      sampleSize: (result.data as unknown as ClickHouseQueryResult<unknown>)?.sampleSize,
      lowSample: (result.data as unknown as ClickHouseQueryResult<unknown>)?.lowSample,
    })

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
