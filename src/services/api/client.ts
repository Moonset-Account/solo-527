import { API_CONFIG, type ApiResponse, type ClickHouseQueryResult } from './config'

function generateRequestId(): string {
  return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9)
}

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      const user = JSON.parse(stored)
      return user.token || 'mock_token_' + user.id
    }
  } catch {
    // ignore
  }
  return null
}

function getCurrentUser(): { role?: string; storeId?: string; regionId?: string } | null {
  try {
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return null
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>
  skipAuth?: boolean
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, skipAuth, ...fetchOptions } = options
  const token = skipAuth ? null : getAuthToken()
  const requestId = generateRequestId()

  let url = API_CONFIG.baseURL + endpoint
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    url += '?' + searchParams.toString()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`, {
    requestId,
    user: getCurrentUser()?.role,
  })

  try {
    const response = await simulateApiCall<T>(endpoint, fetchOptions, params)
    
    console.log(`[API] Response ${endpoint}`, {
      requestId,
      sampleSize: (response.data as unknown as { sampleSize?: number })?.sampleSize,
      lowSample: (response.data as unknown as { lowSample?: boolean })?.lowSample,
    })

    return response
  } catch (error) {
    console.error(`[API] Error ${endpoint}`, { requestId, error })
    throw error
  }
}

async function simulateApiCall<T>(
  endpoint: string,
  fetchOptions: RequestInit,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const delay = 100 + Math.random() * 400
  await new Promise(resolve => setTimeout(resolve, delay))

  const user = getCurrentUser()
  const requestId = generateRequestId()

  const mockHandler = getMockHandler(endpoint)
  const data = await mockHandler(params || {}, fetchOptions.body as string | undefined, user)

  return {
    code: 0,
    message: 'success',
    data: data as T,
    requestId,
    timestamp: Date.now(),
  }
}

function getMockHandler(endpoint: string): (params: Record<string, unknown>, body?: string, user?: { role?: string; storeId?: string; regionId?: string }) => Promise<unknown> {
  const handlers: Record<string, (params: Record<string, unknown>, body?: string, user?: { role?: string; storeId?: string; regionId?: string }) => Promise<unknown>> = {
    '/analytics/core-metrics': handleCoreMetrics,
    '/analytics/cohort': handleCohort,
    '/analytics/funnel': handleFunnel,
    '/analytics/price-trend': handlePriceTrend,
    '/analytics/store-rank': handleStoreRank,
    '/analytics/medicine-comparison': handleMedicineComparison,
    '/analytics/prescription-ranges': handlePrescriptionRanges,
  }

  return handlers[endpoint] || handleDefault
}

import {
  generateCoreMetrics,
  generateCohortData,
  generateFunnelData,
  generatePriceTrend,
  generateStoreRank,
  generateMedicineComparison,
  generatePrescriptionStats,
} from '@/utils/mock'
import { checkLowSample } from '@/utils/privacy'
import { STORES } from '@/utils/constants'
import type { CohortData, CoreMetric, FunnelStep, PriceTrendPoint, StoreRankItem, MedicineComparison, PrescriptionRangeStat } from '@/types'

function applyStoreFilter<T extends { sampleSize: number }>(data: T[], user?: { role?: string; storeId?: string; regionId?: string }): T[] {
  if (user?.role === 'store_manager' && user.storeId) {
    const scale = 0.12
    return data.map(item => ({
      ...item,
      sampleSize: Math.floor(item.sampleSize * scale),
    }))
  }
  return data
}

function applyChronicLabelFilter<T extends { sampleSize: number; lowSample?: boolean }>(
  data: T[],
  chronicLabels: string[]
): T[] {
  if (chronicLabels.length === 0) return data
  
  const scaleFactor = Math.max(0.2, 1 - chronicLabels.length * 0.18)
  return data.map(item => {
    const newSampleSize = Math.floor(item.sampleSize * scaleFactor)
    return {
      ...item,
      sampleSize: newSampleSize,
      lowSample: checkLowSample(newSampleSize),
    }
  })
}

async function handleCoreMetrics(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<CoreMetric[]>> {
  const chronicLabels = (params.chronicLabels as string)?.split(',') || []
  let metrics = generateCoreMetrics()

  if (user?.role === 'store_manager') {
    metrics = metrics.map(m => ({
      ...m,
      value: m.unit === '%' ? m.value : Math.floor(m.value / 8),
      sampleSize: Math.floor(m.sampleSize / 8),
      lowSample: checkLowSample(Math.floor(m.sampleSize / 8)),
    }))
  }

  if (chronicLabels.length > 0) {
    const scale = 1 - chronicLabels.length * 0.2
    metrics = metrics.map(m => ({
      ...m,
      sampleSize: Math.floor(m.sampleSize * scale),
      lowSample: checkLowSample(Math.floor(m.sampleSize * scale)),
    }))
  }

  const totalSampleSize = metrics.reduce((sum, m) => sum + m.sampleSize, 0)
  
  return {
    data: metrics,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_' + Date.now().toString(36),
    executionTime: 45 + Math.floor(Math.random() * 120),
    rowsRead: Math.floor(Math.random() * 500000 + 100000),
    bytesRead: Math.floor(Math.random() * 50 * 1024 * 1024 + 5 * 1024 * 1024),
  }
}

async function handleCohort(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<CohortData[]>> {
  const chronicLabels = (params.chronicLabels as string)?.split(',') || []
  let cohortData = generateCohortData()

  if (user?.role === 'store_manager') {
    cohortData = cohortData.map(cohort => ({
      ...cohort,
      cells: cohort.cells.map(cell => {
        const newSample = Math.floor(cell.sampleSize / 10)
        return {
          ...cell,
          sampleSize: newSample,
          lowSample: checkLowSample(newSample),
          retentionRate: Math.min(100, cell.retentionRate * (0.9 + Math.random() * 0.2)),
        }
      }),
    }))
  }

  if (chronicLabels.length > 0) {
    const scale = Math.max(0.25, 1 - chronicLabels.length * 0.2)
    cohortData = cohortData.slice(0, Math.max(2, cohortData.length - chronicLabels.length))
    cohortData = cohortData.map(cohort => ({
      ...cohort,
      cells: cohort.cells.map(cell => {
        const newSample = Math.floor(cell.sampleSize * scale)
        return {
          ...cell,
          sampleSize: newSample,
          lowSample: checkLowSample(newSample),
          retentionRate: Math.max(5, cell.retentionRate * (0.85 + Math.random() * 0.3)),
        }
      }),
    }))
  }

  const totalSampleSize = cohortData[0]?.cells[0]?.sampleSize || 0

  return {
    data: cohortData,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_cohort_' + Date.now().toString(36),
    executionTime: 120 + Math.floor(Math.random() * 300),
    rowsRead: Math.floor(Math.random() * 2000000 + 500000),
    bytesRead: Math.floor(Math.random() * 200 * 1024 * 1024 + 20 * 1024 * 1024),
  }
}

async function handleFunnel(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<FunnelStep[]>> {
  const chronicLabels = (params.chronicLabels as string)?.split(',') || []
  let funnelData = generateFunnelData()

  if (user?.role === 'store_manager') {
    const scale = 0.12
    funnelData = funnelData.map(step => {
      const newSample = Math.floor(step.sampleSize * scale)
      return {
        ...step,
        value: Math.floor(step.value * scale),
        sampleSize: newSample,
        lowSample: checkLowSample(newSample),
        conversionRate: Math.min(100, step.conversionRate * (0.95 + Math.random() * 0.1)),
      }
    })
  }

  if (chronicLabels.length > 0) {
    const scale = Math.max(0.3, 1 - chronicLabels.length * 0.15)
    funnelData = funnelData.map(step => {
      const newSample = Math.floor(step.sampleSize * scale)
      return {
        ...step,
        value: Math.floor(step.value * scale),
        sampleSize: newSample,
        lowSample: checkLowSample(newSample),
      }
    })
  }

  const totalSampleSize = funnelData[0]?.sampleSize || 0

  return {
    data: funnelData,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_funnel_' + Date.now().toString(36),
    executionTime: 80 + Math.floor(Math.random() * 150),
    rowsRead: Math.floor(Math.random() * 800000 + 200000),
    bytesRead: Math.floor(Math.random() * 80 * 1024 * 1024 + 10 * 1024 * 1024),
  }
}

async function handlePriceTrend(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<PriceTrendPoint[]>> {
  const chronicLabels = (params.chronicLabels as string)?.split(',') || []
  let priceTrend = generatePriceTrend()

  if (user?.role === 'store_manager') {
    priceTrend = priceTrend.map(point => {
      const newSample = Math.floor(point.sampleSize / 10)
      return {
        ...point,
        sampleSize: newSample,
        lowSample: checkLowSample(newSample),
        avgOrderValue: point.avgOrderValue * (0.95 + Math.random() * 0.1),
      }
    })
  }

  if (chronicLabels.length > 0) {
    const scale = Math.max(0.4, 1 - chronicLabels.length * 0.12)
    priceTrend = priceTrend.map(point => {
      const newSample = Math.floor(point.sampleSize * scale)
      return {
        ...point,
        sampleSize: newSample,
        lowSample: checkLowSample(newSample),
        avgOrderValue: point.avgOrderValue * (1 + (Math.random() - 0.5) * 0.1),
      }
    })
  }

  const totalSampleSize = priceTrend[0]?.sampleSize || 0

  return {
    data: priceTrend,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_price_' + Date.now().toString(36),
    executionTime: 60 + Math.floor(Math.random() * 100),
    rowsRead: Math.floor(Math.random() * 300000 + 50000),
    bytesRead: Math.floor(Math.random() * 30 * 1024 * 1024 + 5 * 1024 * 1024),
  }
}

async function handleStoreRank(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<StoreRankItem[]>> {
  let storeRank = generateStoreRank()

  if (user?.role === 'store_manager' && user.storeId) {
    const userStore = STORES.find(s => s.id === user.storeId)
    if (userStore) {
      storeRank = storeRank
        .filter(s => s.storeId === user.storeId)
        .map(s => ({
          ...s,
          storeName: userStore.name,
          region: userStore.region,
        }))
    } else {
      storeRank = []
    }
  }

  if (user?.role === 'region_operation' && user.regionId) {
    const regionStores = STORES.filter(s => s.region === user.regionId).map(s => s.id)
    storeRank = storeRank.filter(s => regionStores.includes(s.storeId))
  }

  const limit = params.limit ? Number(params.limit) : 20
  storeRank = storeRank.slice(0, limit)

  const totalSampleSize = storeRank.reduce((sum, s) => sum + s.sampleSize, 0)

  return {
    data: storeRank,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_store_' + Date.now().toString(36),
    executionTime: 50 + Math.floor(Math.random() * 80),
    rowsRead: Math.floor(Math.random() * 100000 + 10000),
    bytesRead: Math.floor(Math.random() * 10 * 1024 * 1024 + 1024 * 1024),
  }
}

async function handleMedicineComparison(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<MedicineComparison[]>> {
  let comparisonData = generateMedicineComparison()
  const targetCategories = (params.targetCategories as string)?.split(',') || []

  if (targetCategories.length > 0) {
    comparisonData = comparisonData.filter(item => targetCategories.includes(item.category))
  }

  if (user?.role === 'store_manager') {
    const scale = 0.12
    comparisonData = comparisonData.map(item => {
      const newSample = Math.floor(item.sampleSize * scale)
      return {
        ...item,
        sampleSize: newSample,
        lowSample: checkLowSample(newSample),
        growthRate: item.growthRate * (0.9 + Math.random() * 0.2),
      }
    })
  }

  const totalSampleSize = comparisonData.reduce((sum, item) => sum + item.sampleSize, 0)

  return {
    data: comparisonData,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_medicine_' + Date.now().toString(36),
    executionTime: 70 + Math.floor(Math.random() * 120),
    rowsRead: Math.floor(Math.random() * 400000 + 80000),
    bytesRead: Math.floor(Math.random() * 40 * 1024 * 1024 + 8 * 1024 * 1024),
  }
}

async function handlePrescriptionRanges(
  params: Record<string, unknown>,
  _body?: string,
  user?: { role?: string; storeId?: string; regionId?: string }
): Promise<ClickHouseQueryResult<PrescriptionRangeStat[]>> {
  const chronicLabels = (params.chronicLabels as string)?.split(',') || []
  let rangeStats = generatePrescriptionStats()

  if (user?.role === 'store_manager') {
    const scale = 0.1
    rangeStats = rangeStats.map(stat => {
      const newCount = Math.floor(stat.memberCount * scale)
      return {
        ...stat,
        memberCount: newCount,
        lowSample: checkLowSample(newCount),
      }
    })
  }

  if (chronicLabels.length > 0) {
    const scale = Math.max(0.2, 1 - chronicLabels.length * 0.2)
    rangeStats = rangeStats.map(stat => {
      const newCount = Math.floor(stat.memberCount * scale)
      return {
        ...stat,
        memberCount: newCount,
        lowSample: checkLowSample(newCount),
      }
    })
  }

  const totalSampleSize = rangeStats.reduce((sum, stat) => sum + stat.memberCount, 0)

  return {
    data: rangeStats,
    sampleSize: totalSampleSize,
    lowSample: checkLowSample(totalSampleSize),
    queryId: 'ch_rx_' + Date.now().toString(36),
    executionTime: 90 + Math.floor(Math.random() * 150),
    rowsRead: Math.floor(Math.random() * 600000 + 100000),
    bytesRead: Math.floor(Math.random() * 60 * 1024 * 1024 + 10 * 1024 * 1024),
  }
}

async function handleDefault(): Promise<unknown> {
  return null
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

  const endpoint = getEndpointForQueryType(queryType)
  const response = await request<ClickHouseQueryResult<T>>(endpoint, {
    method: 'GET',
    params: allParams,
  })

  return response.data
}

function getEndpointForQueryType(queryType: string): string {
  const mapping: Record<string, string> = {
    'coreMetrics': '/analytics/core-metrics',
    'cohort': '/analytics/cohort',
    'funnel': '/analytics/funnel',
    'priceTrend': '/analytics/price-trend',
    'storeRank': '/analytics/store-rank',
    'medicineComparison': '/analytics/medicine-comparison',
    'prescriptionRanges': '/analytics/prescription-ranges',
  }
  return mapping[queryType] || '/analytics/core-metrics'
}
