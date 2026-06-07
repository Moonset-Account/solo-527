export const API_CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000,
  clickhouseEndpoint: '/clickhouse/query',
}

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  analytics: {
    coreMetrics: '/analytics/core-metrics',
    cohort: '/analytics/cohort',
    funnel: '/analytics/funnel',
    priceTrend: '/analytics/price-trend',
    storeRank: '/analytics/store-rank',
    medicineComparison: '/analytics/medicine-comparison',
    prescriptionRanges: '/analytics/prescription-ranges',
  },
  metadata: {
    stores: '/metadata/stores',
    regions: '/metadata/regions',
    chronicLabels: '/metadata/chronic-labels',
    activities: '/metadata/activities',
  },
  medicine: {
    categories: '/medicine/categories',
  },
} as const

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  requestId: string
  timestamp: number
}

export interface ClickHouseQueryResult<T> {
  data: T
  sampleSize: number
  lowSample: boolean
  queryId: string
  executionTime: number
  rowsRead: number
  bytesRead: number
}
