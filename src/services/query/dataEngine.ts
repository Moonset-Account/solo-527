import type { QueryContext } from './queryContext'
import { calculateDataScale } from './queryContext'
import { checkLowSample } from '@/utils/privacy'
import { STORES, CHRONIC_LABELS, MEMBER_TIERS } from '@/utils/constants'
import type {
  CoreMetric,
  CohortData,
  CohortCell,
  FunnelStep,
  PriceTrendPoint,
  StoreRankItem,
  MedicineComparison,
  PrescriptionRangeStat,
} from '@/types'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getContextSeed(ctx: QueryContext): number {
  const parts = [
    ctx.storeIds.join(','),
    ctx.chronicLabels.join(','),
    ctx.memberTiers.join(','),
    ctx.activityId || '',
  ]
  return hashString(parts.join('|'))
}

function getStoreName(storeId: string): { name: string; region: string } {
  const store = STORES.find(s => s.id === storeId)
  if (store) {
    return { name: store.name, region: store.region }
  }
  return { name: `门店${storeId}`, region: '未知区域' }
}

export function generateCoreMetrics(ctx: QueryContext): CoreMetric[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseMembers = Math.floor(12580 * scale.sampleScale)
  const baseRepurchase = 42.8 + (scale.isChronicFiltered ? 8 : 0) + (scale.isStoreFiltered ? 3 : 0)
  const baseAvgOrder = 156.8 + (scale.isChronicFiltered ? 25 : 0)
  const baseCouponRate = 68.5 + (scale.isChronicFiltered ? 5 : 0) - (scale.isStoreFiltered ? 3 : 0)

  const metrics: CoreMetric[] = [
    {
      name: '活跃会员数',
      value: Math.floor(baseMembers * (0.85 + rand() * 0.1)),
      sampleSize: baseMembers,
      lowSample: checkLowSample(baseMembers),
      trend: 3.2 + rand() * 4,
    },
    {
      name: '复购率',
      value: Math.min(85, baseRepurchase + (rand() - 0.5) * 5),
      sampleSize: baseMembers,
      lowSample: checkLowSample(baseMembers),
      trend: 1.5 + rand() * 3,
      unit: '%',
    },
    {
      name: '平均客单价',
      value: baseAvgOrder + (rand() - 0.5) * 20,
      sampleSize: baseMembers,
      lowSample: checkLowSample(baseMembers),
      trend: -2 + rand() * 3,
      unit: '¥',
    },
    {
      name: '优惠券核销率',
      value: Math.min(95, baseCouponRate + (rand() - 0.5) * 8),
      sampleSize: baseMembers,
      lowSample: checkLowSample(baseMembers),
      trend: 4.5 + rand() * 5,
      unit: '%',
    },
  ]

  return metrics
}

export function generateCohortData(ctx: QueryContext): CohortData[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseSample = Math.floor(1200 * scale.sampleScale)
  const retentionBoost = scale.isChronicFiltered ? 0.15 : 0
  const periods = ctx.retentionPeriods || 6
  const cohortCount = Math.max(3, 6 - (scale.isStoreFiltered ? 1 : 0) - scale.chronicCount)

  const cohorts: CohortData[] = []
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']

  for (let c = 0; c < cohortCount; c++) {
    const cohortMonth = months[c]
    const cohortSize = Math.floor(baseSample * (0.7 + rand() * 0.6))
    const cells: CohortCell[] = []

    for (let p = 0; p < periods - c; p++) {
      const decay = Math.pow(0.88, p)
      const randomFactor = 0.85 + rand() * 0.3
      const retention = Math.max(3, Math.min(85, 65 * decay * (1 + retentionBoost) * randomFactor))
      const cellSample = Math.floor(cohortSize * decay * (0.9 + rand() * 0.2))

      cells.push({
        period: `第${p + 1}月`,
        periodNum: p + 1,
        retentionRate: retention,
        sampleSize: cellSample,
        lowSample: checkLowSample(cellSample),
      })
    }

    cohorts.push({
      cohort: cohortMonth,
      periodCount: cells.length,
      cells,
    })
  }

  return cohorts
}

export function generateFunnelData(ctx: QueryContext): FunnelStep[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseSample = Math.floor(8500 * scale.sampleScale)
  const conversionBoost = scale.isChronicFiltered ? 1.1 : 1

  const steps = [
    { name: '曝光人数', baseRate: 1.0 },
    { name: '领取优惠券', baseRate: 0.65 },
    { name: '访问商品页', baseRate: 0.45 },
    { name: '加入购物车', baseRate: 0.32 },
    { name: '完成支付', baseRate: 0.25 },
  ]

  return steps.map((step, i) => {
    const value = Math.floor(baseSample * step.baseRate * conversionBoost * (0.95 + rand() * 0.1))
    const sampleSize = value
    return {
      name: step.name,
      value,
      sampleSize,
      lowSample: checkLowSample(sampleSize),
      conversionRate: i === 0 ? 100 : Math.floor((value / (baseSample * steps[0].baseRate)) * 100),
    }
  })
}

export function generatePriceTrend(ctx: QueryContext): PriceTrendPoint[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseSample = Math.floor(800 * scale.sampleScale)
  const basePrice = 156 + (scale.isChronicFiltered ? 30 : 0) + (scale.isStoreFiltered ? -10 : 0)

  const months = [
    '2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12',
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  ]

  return months.map((date, i) => {
    const trendFactor = 1 + i * 0.008
    const sampleSize = Math.floor(baseSample * (0.9 + rand() * 0.2))
    return {
      date,
      avgOrderValue: basePrice * trendFactor * (0.95 + rand() * 0.1),
      sampleSize,
      lowSample: checkLowSample(sampleSize),
    }
  })
}

export function generateStoreRank(ctx: QueryContext): StoreRankItem[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  let storesToUse = STORES

  if (ctx.storeIds.length > 0) {
    storesToUse = STORES.filter(s => ctx.storeIds.includes(s.id))
  }

  if (ctx.regionIds.length > 0) {
    const regionStores = ctx.regionIds.flatMap(rid =>
      STORES.filter(s => s.region === rid).map(s => s.id)
    )
    storesToUse = storesToUse.filter(s => regionStores.includes(s.id) || ctx.storeIds.includes(s.id))
  }

  const rankItems: StoreRankItem[] = storesToUse.map(store => {
    const baseRate = 35 + rand() * 20
    const baseSample = Math.floor((500 + rand() * 2000) * scale.sampleScale)
    return {
      storeId: store.id,
      storeName: store.name,
      region: store.region,
      repurchaseRate: baseRate,
      orderCount: Math.floor(baseSample * (3 + rand() * 5)),
      sampleSize: baseSample,
      lowSample: checkLowSample(baseSample),
    }
  })

  return rankItems.sort((a, b) => b.repurchaseRate - a.repurchaseRate)
}

export function generateMedicineComparison(ctx: QueryContext): MedicineComparison[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const categories = [
    { id: 'diabetes', name: '糖尿病用药', baseGrowth: 15 },
    { id: 'hypertension', name: '高血压用药', baseGrowth: 12 },
    { id: 'cardio', name: '心脑血管', baseGrowth: 18 },
    { id: 'cold', name: '感冒发烧', baseGrowth: 5 },
    { id: 'vitamin', name: '维生素保健', baseGrowth: 22 },
    { id: 'skin', name: '皮肤用药', baseGrowth: 8 },
  ]

  let filtered = categories
  if (ctx.targetCategories && ctx.targetCategories.length > 0) {
    filtered = categories.filter(c => ctx.targetCategories.includes(c.id) || ctx.targetCategories.includes(c.name))
  }

  return filtered.map(cat => {
    const baseSales = Math.floor((10000 + rand() * 50000) * scale.sampleScale)
    const growth = cat.baseGrowth + (scale.isChronicFiltered ? 8 : 0) + (rand() - 0.5) * 10
    const sampleSize = Math.floor(baseSales / 5)

    return {
      category: cat.name,
      beforeActivity: baseSales,
      afterActivity: Math.floor(baseSales * (1 + growth / 100)),
      growthRate: growth,
      sampleSize,
      lowSample: checkLowSample(sampleSize),
    }
  })
}

export function generatePrescriptionRanges(ctx: QueryContext): PrescriptionRangeStat[] {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseTotal = Math.floor(35000 * scale.sampleScale)
  const ranges = [
    { range: '0-10次', pct: 0.45 },
    { range: '10-20次', pct: 0.26 },
    { range: '20-50次', pct: 0.19 },
    { range: '50-100次', pct: 0.07 },
    { range: '100次以上', pct: 0.03 },
  ]

  const chronicBoost = scale.isChronicFiltered ? 1.5 : 1

  return ranges.map(r => {
    const count = Math.floor(baseTotal * r.pct * chronicBoost * (0.95 + rand() * 0.1))
    return {
      range: r.range,
      memberCount: count,
      percentage: r.pct * 100,
      lowSample: checkLowSample(count),
    }
  })
}
