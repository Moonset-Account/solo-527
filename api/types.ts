export interface FilterState {
  collectionTypes: string[]
  readerGroups: string[]
  themes: string[]
  branches: string[]
  dateRange: { start: string; end: string }
}

export interface KpiData {
  borrowCount: { value: number; yoyChange: number; momChange: number; isAnomaly: boolean; trend: { week: string; value: number }[] }
  renewalRate: { value: number; yoyChange: number; momChange: number; isAnomaly: boolean; trend: { week: string; value: number }[] }
  reservationFulfillRate: { value: number; yoyChange: number; momChange: number; isAnomaly: boolean; trend: { week: string; value: number }[] }
  overdueRate: { value: number; yoyChange: number; momChange: number; isAnomaly: boolean; trend: { week: string; value: number }[] }
}

export interface ThemeTrendData {
  themes: { name: string; data: { month: string; count: number; yoyChange: number }[] }[]
  rankings: { theme: string; currentRank: number; previousRank: number; change: number }[]
  subThemes: { theme: string; subs: { name: string; count: number }[] }[]
}

export interface BranchCompareData {
  branches: { id: string; name: string; borrowCount: number; renewalRate: number; reservationRate: number; overdueRate: number; utilizationRate: number }[]
  monthlyData: { month: string; [branchName: string]: number | string }[]
}

export interface ReservationWaitData {
  queueDepth: { bookTitle: string; queueSize: number; urgency: 'high' | 'medium' | 'low' }[]
  waitDistribution: { range: string; count: number; median: number }[]
  fulfillRateTrend: { week: string; rate: number; isAnomaly: boolean }[]
}

export interface OverdueHeatmapData {
  matrix: { theme: string; ageGroup: string; rate: number; count: number }[]
  readerProfile: { ageGroup: string; count: number; avgBorrowFreq: number; isChildAggregated: boolean }[]
  themeCluster: { theme: string; overdueCount: number; overdueRate: number }[]
}

export interface WeeklyReportData {
  reportId: string
  weekStart: string
  weekEnd: string
  keyChanges: string[]
  yoyComparison: { metric: string; current: number; previous: number; change: number }[]
  momComparison: { metric: string; current: number; previous: number; change: number }[]
  anomalies: { type: string; description: string; severity: 'high' | 'medium' | 'low' }[]
  filterSnapshot: FilterState
  generatedAt: string
}

export interface FilterOptions {
  collectionTypes: string[]
  readerGroups: { key: string; label: string; aggregationOnly: boolean }[]
  themes: string[]
  branches: { id: string; name: string }[]
}

export interface MetaInfo {
  updatedAt: string
  cacheHit: boolean
  filterSnapshot: FilterState
  childDataAggregated: boolean
}
