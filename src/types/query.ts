export interface QueryFilter {
  storeIds?: string[]
  regionIds?: string[]
  startDate?: string
  endDate?: string
  chronicLabels?: string[]
  memberTier?: string[]
  minAge?: number
  maxAge?: number
  gender?: 'male' | 'female'
  medicineCategories?: string[]
  activityId?: string
}

export interface CohortQueryParams extends QueryFilter {
  cohortPeriod?: 'month' | 'quarter'
  retentionPeriods?: number
}

export interface FunnelQueryParams extends QueryFilter {
  activityId: string
}

export interface PriceTrendQueryParams extends QueryFilter {
  granularity?: 'day' | 'week' | 'month'
}

export interface StoreRankQueryParams extends QueryFilter {
  limit?: number
}

export interface MedicineComparisonQueryParams extends QueryFilter {
  activityId: string
  targetCategories: string[]
}

export interface PrescriptionRangeQueryParams extends QueryFilter {
  ranges?: number[]
}

export interface PaginatedResult<T> {
  data: T
  sampleSize: number
  lowSample: boolean
  queryId: string
  executionTime: number
}
