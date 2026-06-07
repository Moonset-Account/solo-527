import { clickhouseQuery } from './api/client'
import type {
  CohortQueryParams,
  FunnelQueryParams,
  PriceTrendQueryParams,
  StoreRankQueryParams,
  MedicineComparisonQueryParams,
  PrescriptionRangeQueryParams,
  QueryFilter,
} from '@/types/query'
import type {
  CohortData,
  FunnelStep,
  PriceTrendPoint,
  StoreRankItem,
  MedicineComparison,
  PrescriptionRangeStat,
  CoreMetric,
} from '@/types'
import type { ClickHouseQueryResult } from './api/config'
import { CACHE_TTL } from '@/utils/constants'

const QUERY_CACHE = new Map<string, { data: ClickHouseQueryResult<unknown>; timestamp: number }>()

function getCacheKey(prefix: string, params: unknown): string {
  return `${prefix}_${JSON.stringify(params)}`
}

function getCached<T>(key: string): ClickHouseQueryResult<T> | null {
  const cached = QUERY_CACHE.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as ClickHouseQueryResult<T>
  }
  if (cached) {
    QUERY_CACHE.delete(key)
  }
  return null
}

function setCache<T>(key: string, data: ClickHouseQueryResult<T>): void {
  QUERY_CACHE.set(key, { data: data as ClickHouseQueryResult<unknown>, timestamp: Date.now() })
}

function buildQueryParams(filter: QueryFilter): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  
  if (filter.storeIds && filter.storeIds.length > 0) {
    params.storeIds = filter.storeIds.join(',')
  }
  if (filter.regionIds && filter.regionIds.length > 0) {
    params.regionIds = filter.regionIds.join(',')
  }
  if (filter.chronicLabels && filter.chronicLabels.length > 0) {
    params.chronicLabels = filter.chronicLabels.join(',')
  }
  if (filter.memberTier && filter.memberTier.length > 0) {
    params.memberTier = filter.memberTier.join(',')
  }
  if (filter.startDate) {
    params.startDate = filter.startDate
  }
  if (filter.endDate) {
    params.endDate = filter.endDate
  }
  
  return params
}

export async function queryCoreMetrics(filter: QueryFilter = {}) {
  const cacheKey = getCacheKey('coreMetrics', filter)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const params = buildQueryParams(filter)
  const result = await clickhouseQuery<CoreMetric[]>('coreMetrics', params)
  setCache(cacheKey, result)
  return result
}

export async function queryCohortData(params: CohortQueryParams = {}) {
  const cacheKey = getCacheKey('cohort', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    cohortPeriod: params.cohortPeriod || 'month',
    retentionPeriods: params.retentionPeriods || 6,
  }
  const result = await clickhouseQuery<CohortData[]>('cohort', queryParams)
  setCache(cacheKey, result)
  return result
}

export async function queryFunnelData(params: FunnelQueryParams) {
  const cacheKey = getCacheKey('funnel', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    activityId: params.activityId,
  }
  const result = await clickhouseQuery<FunnelStep[]>('funnel', queryParams)
  setCache(cacheKey, result)
  return result
}

export async function queryPriceTrend(params: PriceTrendQueryParams = {}) {
  const cacheKey = getCacheKey('priceTrend', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    granularity: params.granularity || 'month',
  }
  const result = await clickhouseQuery<PriceTrendPoint[]>('priceTrend', queryParams)
  setCache(cacheKey, result)
  return result
}

export async function queryStoreRank(params: StoreRankQueryParams = {}) {
  const cacheKey = getCacheKey('storeRank', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    limit: params.limit || 20,
  }
  const result = await clickhouseQuery<StoreRankItem[]>('storeRank', queryParams)
  setCache(cacheKey, result)
  return result
}

export async function queryMedicineComparison(params: MedicineComparisonQueryParams) {
  const cacheKey = getCacheKey('medicineComparison', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    activityId: params.activityId,
    targetCategories: params.targetCategories?.join(','),
  }
  const result = await clickhouseQuery<MedicineComparison[]>('medicineComparison', queryParams)
  setCache(cacheKey, result)
  return result
}

export async function queryPrescriptionRangeStats(params: PrescriptionRangeQueryParams = {}) {
  const cacheKey = getCacheKey('prescriptionRange', params)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const queryParams = {
    ...buildQueryParams(params),
    ranges: params.ranges?.join(','),
  }
  const result = await clickhouseQuery<PrescriptionRangeStat[]>('prescriptionRanges', queryParams)
  setCache(cacheKey, result)
  return result
}

export function clearQueryCache(): void {
  QUERY_CACHE.clear()
  console.log('[ClickHouse] Query cache cleared')
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: QUERY_CACHE.size,
    keys: Array.from(QUERY_CACHE.keys()),
  }
}
