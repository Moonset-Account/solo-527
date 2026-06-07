export type UserRole = 'store_manager' | 'region_operation' | 'headquarters_operation'

export interface User {
  id: string
  name: string
  role: UserRole
  storeId?: string
  regionId?: string
  token?: string
  permissions: string[]
}

export interface PermissionConfig {
  canExport: boolean
  canViewPersonalData: boolean
  canViewAllStores: boolean
  canManageCategory: boolean
}

export type MaskType = 'full' | 'partial' | 'range' | 'aggregate-only'

export interface PrivacyRule {
  field: string
  maskType: MaskType
  maskPattern?: string
  minSampleSize: number
}

export interface CoreMetric {
  name: string
  value: number
  unit: string
  trend: number
  sampleSize: number
  lowSample: boolean
}

export interface CohortCell {
  period: number
  retentionRate: number
  sampleSize: number
  lowSample: boolean
}

export interface CohortData {
  cohortPeriod: string
  cells: CohortCell[]
}

export interface FunnelStep {
  name: string
  value: number
  conversionRate: number
  sampleSize: number
  lowSample: boolean
}

export interface StoreData {
  id: string
  name: string
  region: string
  repurchaseRate: number
  avgOrderValue: number
  totalSales: number
  sampleSize: number
}

export interface MedicineCategory {
  id: string
  name: string
  parentId: string | null
  level: number
  medicines: string[]
}

export interface MedicineComparison {
  category: string
  beforeActivity: number
  afterActivity: number
  growthRate: number
  sampleSize: number
  lowSample: boolean
}

export interface ActivityData {
  id: string
  name: string
  startDate: string
  endDate: string
  couponFunnel: FunnelStep[]
  medicineComparison: MedicineComparison[]
}

export interface MemberTier {
  name: string
  count: number
  percentage: number
  avgOrderValue: number
  repurchaseRate: number
  sampleSize: number
  lowSample: boolean
}

export interface ChronicTag {
  id: string
  name: string
  count: number
}

export interface PriceTrendPoint {
  date: string
  avgOrderValue: number
  sampleSize: number
  lowSample: boolean
}

export interface PrescriptionRangeStat {
  range: string
  memberCount: number
  percentage: number
  lowSample: boolean
}

export interface StoreRankItem {
  storeId: string
  storeName: string
  region: string
  repurchaseRate: number
  orderCount: number
  sampleSize: number
  lowSample: boolean
}

export interface StoreData {
  id: string
  name: string
  region: string
  repurchaseRate: number
  avgOrderValue: number
  totalSales: number
  sampleSize: number
}
