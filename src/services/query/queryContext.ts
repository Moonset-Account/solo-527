export interface QueryContext {
  storeIds: string[]
  regionIds: string[]
  chronicLabels: string[]
  memberTiers: string[]
  startDate?: string
  endDate?: string
  activityId?: string
  granularity?: 'day' | 'week' | 'month'
  cohortPeriod?: 'month' | 'quarter'
  retentionPeriods?: number
  targetCategories?: string[]
  userRole?: string
  userStoreId?: string
  userRegionId?: string
}

export const DEFAULT_QUERY_CONTEXT: QueryContext = {
  storeIds: [],
  regionIds: [],
  chronicLabels: [],
  memberTiers: [],
  granularity: 'month',
  cohortPeriod: 'month',
  retentionPeriods: 6,
  targetCategories: [],
}

export function createQueryContext(params: Partial<QueryContext> = {}): QueryContext {
  const ctx: QueryContext = { ...DEFAULT_QUERY_CONTEXT, ...params }
  return applyPermissionOverride(ctx)
}

function applyPermissionOverride(ctx: QueryContext): QueryContext {
  if (ctx.userRole === 'store_manager' && ctx.userStoreId) {
    return {
      ...ctx,
      storeIds: [ctx.userStoreId],
      regionIds: [],
    }
  }
  if (ctx.userRole === 'region_operation' && ctx.userRegionId) {
    return {
      ...ctx,
      regionIds: [ctx.userRegionId],
    }
  }
  return ctx
}

export function getQueryFingerprint(ctx: QueryContext): string {
  return [
    ctx.storeIds.sort().join(','),
    ctx.regionIds.sort().join(','),
    ctx.chronicLabels.sort().join(','),
    ctx.memberTiers.sort().join(','),
    ctx.startDate || '',
    ctx.endDate || '',
    ctx.activityId || '',
    ctx.granularity || '',
    ctx.cohortPeriod || '',
    ctx.retentionPeriods || '',
    ctx.targetCategories.sort().join(','),
  ].join('|')
}

export function calculateDataScale(ctx: QueryContext): {
  sampleScale: number
  storeCount: number
  chronicCount: number
  tierCount: number
  isStoreFiltered: boolean
  isChronicFiltered: boolean
} {
  const totalStores = 20
  const totalChronic = 8
  const totalTiers = 5

  const storeCount = ctx.storeIds.length > 0 ? ctx.storeIds.length : totalStores
  const chronicCount = ctx.chronicLabels.length > 0 ? ctx.chronicLabels.length : 0
  const tierCount = ctx.memberTiers.length > 0 ? ctx.memberTiers.length : 0

  let sampleScale = 1.0

  if (ctx.storeIds.length > 0) {
    sampleScale *= ctx.storeIds.length / totalStores
  }

  if (ctx.chronicLabels.length > 0) {
    const chronicScale = Math.max(0.15, 1 - ctx.chronicLabels.length * 0.12)
    sampleScale *= chronicScale
  }

  if (ctx.memberTiers.length > 0) {
    sampleScale *= ctx.memberTiers.length / totalTiers
  }

  return {
    sampleScale: Math.max(0.02, sampleScale),
    storeCount,
    chronicCount,
    tierCount,
    isStoreFiltered: ctx.storeIds.length > 0,
    isChronicFiltered: ctx.chronicLabels.length > 0,
  }
}
