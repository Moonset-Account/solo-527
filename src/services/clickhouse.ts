import type {
  QueryFilter,
  CohortQueryParams,
  FunnelQueryParams,
  PriceTrendQueryParams,
  StoreRankQueryParams,
  MedicineComparisonQueryParams,
  PrescriptionRangeQueryParams,
  PaginatedResult
} from '@/types/query'
import type {
  CohortData,
  FunnelStep,
  PriceTrendPoint,
  StoreRankItem,
  MedicineComparison,
  PrescriptionRangeStat,
  CoreMetric
} from '@/types'
import { generateMockData } from '@/utils/mock'
import { checkLowSample } from '@/utils/privacy'
import { useAuthStore } from '@/stores/auth'
import { STORE_CACHE_KEY, CACHE_TTL } from '@/utils/constants'

const QUERY_CACHE = new Map<string, { data: unknown; timestamp: number }>()

function generateQueryId(): string {
  return 'qry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function applyPermissionFilter(filter: QueryFilter): QueryFilter {
  const authStore = useAuthStore()
  const user = authStore.user
  
  if (!user) {
    return { ...filter, storeIds: [] }
  }

  if (!authStore.permissions.canViewAllStores) {
    return {
      ...filter,
      storeIds: user.storeId ? [user.storeId] : []
    }
  }

  if (user.regionId && !authStore.permissions.canViewAllStores) {
    return {
      ...filter,
      regionIds: [user.regionId]
    }
  }

  return filter
}

function getCacheKey(prefix: string, params: unknown): string {
  return `${prefix}_${JSON.stringify(params)}`
}

function getCached<T>(key: string): T | null {
  const cached = QUERY_CACHE.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  if (cached) {
    QUERY_CACHE.delete(key)
  }
  return null
}

function setCache(key: string, data: unknown): void {
  QUERY_CACHE.set(key, { data, timestamp: Date.now() })
}

async function simulateQueryDelay(): Promise<void> {
  const delay = 50 + Math.random() * 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

function applyChronicLabelFilter<T>(data: T[], chronicLabels?: string[]): T[] {
  if (!chronicLabels || chronicLabels.length === 0) {
    return data
  }
  const sampleReduction = Math.max(0.3, 1 - chronicLabels.length * 0.15)
  const filteredCount = Math.max(1, Math.floor(data.length * sampleReduction))
  return data.slice(0, filteredCount)
}

function wrapResult<T>(data: T, baseSampleSize: number): PaginatedResult<T> {
  const lowSample = checkLowSample(baseSampleSize)
  return {
    data,
    sampleSize: baseSampleSize,
    lowSample,
    queryId: generateQueryId(),
    executionTime: Math.floor(50 + Math.random() * 200)
  }
}

export async function queryCoreMetrics(filter: QueryFilter = {}): Promise<PaginatedResult<CoreMetric[]>> {
  const appliedFilter = applyPermissionFilter(filter)
  const cacheKey = getCacheKey('coreMetrics', appliedFilter)
  const cached = getCached<PaginatedResult<CoreMetric[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()
  
  let baseSampleSize = 12580
  if (appliedFilter.chronicLabels && appliedFilter.chronicLabels.length > 0) {
    baseSampleSize = Math.floor(baseSampleSize * (1 - appliedFilter.chronicLabels.length * 0.2))
  }
  if (appliedFilter.storeIds && appliedFilter.storeIds.length > 0) {
    baseSampleSize = Math.floor(baseSampleSize / 8)
  }

  const metrics: CoreMetric[] = [
    { name: '活跃会员数', value: Math.floor(baseSampleSize * 0.85), sampleSize: baseSampleSize, lowSample: checkLowSample(baseSampleSize), trend: 5.2 },
    { name: '复购率', value: 42.8, sampleSize: baseSampleSize, lowSample: checkLowSample(baseSampleSize), trend: 3.1, unit: '%' },
    { name: '平均客单价', value: 156.8, sampleSize: baseSampleSize, lowSample: checkLowSample(baseSampleSize), trend: -1.2, unit: '¥' },
    { name: '优惠券核销率', value: 68.5, sampleSize: baseSampleSize, lowSample: checkLowSample(baseSampleSize), trend: 8.7, unit: '%' }
  ]

  const result = wrapResult(metrics, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryCohortData(params: CohortQueryParams = {}): Promise<PaginatedResult<CohortData[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('cohort', appliedFilter)
  const cached = getCached<PaginatedResult<CohortData[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let cohortData = mock.cohortData

  if (appliedFilter.chronicLabels && appliedFilter.chronicLabels.length > 0) {
    cohortData = applyChronicLabelFilter(cohortData, appliedFilter.chronicLabels)
    cohortData = cohortData.map(cohort => ({
      ...cohort,
      cells: cohort.cells.map(cell => ({
        ...cell,
        sampleSize: Math.floor(cell.sampleSize * 0.4),
        lowSample: checkLowSample(Math.floor(cell.sampleSize * 0.4))
      }))
    }))
  }

  if (appliedFilter.storeIds && appliedFilter.storeIds.length > 0) {
    cohortData = cohortData.map(cohort => ({
      ...cohort,
      cells: cohort.cells.map(cell => ({
        ...cell,
        sampleSize: Math.floor(cell.sampleSize / 10),
        lowSample: checkLowSample(Math.floor(cell.sampleSize / 10))
      }))
    }))
  }

  let totalSampleSize = cohortData.length > 0 ? cohortData[0].cells[0]?.sampleSize || 0 : 0
  const result = wrapResult(cohortData, totalSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryFunnelData(params: FunnelQueryParams): Promise<PaginatedResult<FunnelStep[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('funnel', appliedFilter)
  const cached = getCached<PaginatedResult<FunnelStep[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let funnelData = [...mock.funnelData]

  if (appliedFilter.storeIds && appliedFilter.storeIds.length > 0) {
    const scale = 0.12
    funnelData = funnelData.map(step => ({
      ...step,
      value: Math.floor(step.value * scale),
      sampleSize: Math.floor(step.sampleSize * scale),
      lowSample: checkLowSample(Math.floor(step.sampleSize * scale))
    }))
  }

  if (appliedFilter.chronicLabels && appliedFilter.chronicLabels.length > 0) {
    const scale = 0.5
    funnelData = funnelData.map(step => ({
      ...step,
      value: Math.floor(step.value * scale),
      sampleSize: Math.floor(step.sampleSize * scale),
      lowSample: checkLowSample(Math.floor(step.sampleSize * scale))
    }))
  }

  const baseSampleSize = funnelData[0]?.sampleSize || 0
  const result = wrapResult(funnelData, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryPriceTrend(params: PriceTrendQueryParams = {}): Promise<PaginatedResult<PriceTrendPoint[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('priceTrend', appliedFilter)
  const cached = getCached<PaginatedResult<PriceTrendPoint[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let priceTrend = [...mock.priceTrend]

  if (appliedFilter.storeIds && appliedFilter.storeIds.length > 0) {
    priceTrend = priceTrend.map(point => ({
      ...point,
      sampleSize: Math.floor(point.sampleSize / 10),
      lowSample: checkLowSample(Math.floor(point.sampleSize / 10))
    }))
  }

  if (appliedFilter.chronicLabels && appliedFilter.chronicLabels.length > 0) {
    priceTrend = priceTrend.map(point => ({
      ...point,
      sampleSize: Math.floor(point.sampleSize * 0.6),
      lowSample: checkLowSample(Math.floor(point.sampleSize * 0.6))
    }))
  }

  const baseSampleSize = priceTrend[0]?.sampleSize || 0
  const result = wrapResult(priceTrend, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryStoreRank(params: StoreRankQueryParams = {}): Promise<PaginatedResult<StoreRankItem[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('storeRank', appliedFilter)
  const cached = getCached<PaginatedResult<StoreRankItem[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let storeRank = [...mock.storeRank]

  if (!useAuthStore().permissions.canViewAllStores) {
    const userStoreId = useAuthStore().user?.storeId
    if (userStoreId) {
      storeRank = storeRank.filter(s => s.storeId === userStoreId)
    }
  }

  if (appliedFilter.limit) {
    storeRank = storeRank.slice(0, appliedFilter.limit)
  }

  const baseSampleSize = storeRank.reduce((sum, s) => sum + s.orderCount, 0)
  const result = wrapResult(storeRank, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryMedicineComparison(params: MedicineComparisonQueryParams): Promise<PaginatedResult<MedicineComparison[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('medicineComparison', appliedFilter)
  const cached = getCached<PaginatedResult<MedicineComparison[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let comparisonData = [...mock.medicineComparison]

  if (params.targetCategories && params.targetCategories.length > 0) {
    comparisonData = comparisonData.filter(item => 
      params.targetCategories.includes(item.category)
    )
  }

  if (appliedFilter.storeIds && appliedFilter.storeIds.length > 0) {
    comparisonData = comparisonData.map(item => ({
      ...item,
      sampleSize: Math.floor(item.sampleSize / 10),
      lowSample: checkLowSample(Math.floor(item.sampleSize / 10))
    }))
  }

  const baseSampleSize = comparisonData.reduce((sum, item) => sum + item.sampleSize, 0)
  const result = wrapResult(comparisonData, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export async function queryPrescriptionRangeStats(params: PrescriptionRangeQueryParams = {}): Promise<PaginatedResult<PrescriptionRangeStat[]>> {
  const appliedFilter = applyPermissionFilter(params)
  const cacheKey = getCacheKey('prescriptionRange', appliedFilter)
  const cached = getCached<PaginatedResult<PrescriptionRangeStat[]>>(cacheKey)
  if (cached) return cached

  await simulateQueryDelay()

  const mock = generateMockData()
  let rangeStats = [...mock.prescriptionRanges]

  if (appliedFilter.chronicLabels && appliedFilter.chronicLabels.length > 0) {
    rangeStats = rangeStats.map(stat => ({
      ...stat,
      memberCount: Math.floor(stat.memberCount * 0.5),
      lowSample: checkLowSample(Math.floor(stat.memberCount * 0.5))
    }))
  }

  const baseSampleSize = rangeStats.reduce((sum, stat) => sum + stat.memberCount, 0)
  const result = wrapResult(rangeStats, baseSampleSize)
  setCache(cacheKey, result)
  return result
}

export function clearQueryCache(): void {
  QUERY_CACHE.clear()
  localStorage.removeItem(STORE_CACHE_KEY)
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: QUERY_CACHE.size,
    keys: Array.from(QUERY_CACHE.keys())
  }
}
