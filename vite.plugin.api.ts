import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

const API_BASE = '/api/v1'
const DEFAULT_MIN_SAMPLE_SIZE = 10

interface QueryContext {
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

const STORES = [
  { id: 'STORE-001', name: '中心店', region: '华东区' },
  { id: 'STORE-002', name: '东门店', region: '华东区' },
  { id: 'STORE-003', name: '西门店', region: '华东区' },
  { id: 'STORE-004', name: '南门店', region: '华东区' },
  { id: 'STORE-005', name: '北门店', region: '华东区' },
  { id: 'STORE-006', name: '中关村店', region: '华北区' },
  { id: 'STORE-007', name: '国贸店', region: '华北区' },
  { id: 'STORE-008', name: '天河店', region: '华南区' },
]

function isLowSample(sampleSize: number, minSize = DEFAULT_MIN_SAMPLE_SIZE): boolean {
  return sampleSize < minSize
}

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

function calculateDataScale(ctx: QueryContext) {
  const totalStores = 20
  const storeCount = ctx.storeIds.length > 0 ? ctx.storeIds.length : totalStores
  const chronicCount = ctx.chronicLabels.length

  let sampleScale = 1.0
  if (ctx.storeIds.length > 0) {
    sampleScale *= ctx.storeIds.length / totalStores
  }
  if (ctx.chronicLabels.length > 0) {
    const chronicScale = Math.max(0.15, 1 - ctx.chronicLabels.length * 0.12)
    sampleScale *= chronicScale
  }
  if (ctx.memberTiers.length > 0) {
    sampleScale *= ctx.memberTiers.length / 5
  }

  return {
    sampleScale: Math.max(0.02, sampleScale),
    storeCount,
    chronicCount,
    isStoreFiltered: ctx.storeIds.length > 0,
    isChronicFiltered: ctx.chronicLabels.length > 0,
  }
}

function createQueryContext(params: Partial<QueryContext> = {}): QueryContext {
  const ctx: QueryContext = {
    storeIds: [],
    regionIds: [],
    chronicLabels: [],
    memberTiers: [],
    granularity: 'month',
    cohortPeriod: 'month',
    retentionPeriods: 6,
    targetCategories: [],
    ...params,
  }

  if (ctx.userRole === 'store_manager' && ctx.userStoreId) {
    ctx.storeIds = [ctx.userStoreId]
    ctx.regionIds = []
  }
  if (ctx.userRole === 'region_operation' && ctx.userRegionId) {
    ctx.regionIds = [ctx.userRegionId]
  }

  return ctx
}

function generateCoreMetrics(ctx: QueryContext) {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseMembers = Math.floor(12580 * scale.sampleScale)
  const baseRepurchase = 42.8 + (scale.isChronicFiltered ? 8 : 0) + (scale.isStoreFiltered ? 3 : 0)
  const baseAvgOrder = 156.8 + (scale.isChronicFiltered ? 25 : 0)
  const baseCouponRate = 68.5 + (scale.isChronicFiltered ? 5 : 0) - (scale.isStoreFiltered ? 3 : 0)

  return [
    {
      name: '活跃会员数',
      value: Math.floor(baseMembers * (0.85 + rand() * 0.1)),
      sampleSize: baseMembers,
      lowSample: isLowSample(baseMembers),
      trend: 3.2 + rand() * 4,
    },
    {
      name: '复购率',
      value: Math.min(85, baseRepurchase + (rand() - 0.5) * 5),
      sampleSize: baseMembers,
      lowSample: isLowSample(baseMembers),
      trend: 1.5 + rand() * 3,
      unit: '%',
    },
    {
      name: '平均客单价',
      value: baseAvgOrder + (rand() - 0.5) * 20,
      sampleSize: baseMembers,
      lowSample: isLowSample(baseMembers),
      trend: -2 + rand() * 3,
      unit: '¥',
    },
    {
      name: '优惠券核销率',
      value: Math.min(95, baseCouponRate + (rand() - 0.5) * 8),
      sampleSize: baseMembers,
      lowSample: isLowSample(baseMembers),
      trend: 4.5 + rand() * 5,
      unit: '%',
    },
  ]
}

function generateCohortData(ctx: QueryContext) {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  const baseSample = Math.floor(1200 * scale.sampleScale)
  const retentionBoost = scale.isChronicFiltered ? 0.15 : 0
  const periods = ctx.retentionPeriods || 6
  const cohortCount = Math.max(3, 6 - (scale.isStoreFiltered ? 1 : 0) - scale.chronicCount)

  const cohorts = []
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']

  for (let c = 0; c < cohortCount; c++) {
    const cohortMonth = months[c]
    const cohortSize = Math.floor(baseSample * (0.7 + rand() * 0.6))
    const cells = []

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
        lowSample: isLowSample(cellSample),
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

function generateFunnelData(ctx: QueryContext) {
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
      lowSample: isLowSample(sampleSize),
      conversionRate: i === 0 ? 100 : Math.floor((value / (baseSample * steps[0].baseRate)) * 100),
    }
  })
}

function generatePriceTrend(ctx: QueryContext) {
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
      lowSample: isLowSample(sampleSize),
    }
  })
}

function generateStoreRank(ctx: QueryContext) {
  const scale = calculateDataScale(ctx)
  const seed = getContextSeed(ctx)
  const rand = seededRandom(seed)

  let storesToUse = STORES

  if (ctx.storeIds.length > 0) {
    storesToUse = STORES.filter(s => ctx.storeIds.includes(s.id))
  }

  if (ctx.regionIds.length > 0) {
    storesToUse = storesToUse.filter(s => ctx.regionIds.includes(s.region))
  }

  const rankItems = storesToUse.map(store => {
    const baseRate = 35 + rand() * 20
    const baseSample = Math.floor((500 + rand() * 2000) * scale.sampleScale)
    return {
      storeId: store.id,
      storeName: store.name,
      region: store.region,
      repurchaseRate: baseRate,
      orderCount: Math.floor(baseSample * (3 + rand() * 5)),
      sampleSize: baseSample,
      lowSample: isLowSample(baseSample),
    }
  })

  return rankItems.sort((a, b) => b.repurchaseRate - a.repurchaseRate)
}

function generateMedicineComparison(ctx: QueryContext) {
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
    filtered = categories.filter(c =>
      ctx.targetCategories.includes(c.id) || ctx.targetCategories.includes(c.name)
    )
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
      lowSample: isLowSample(sampleSize),
    }
  })
}

function generatePrescriptionRanges(ctx: QueryContext) {
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
      lowSample: isLowSample(count),
    }
  })
}

function parseQueryParams(req: IncomingMessage): Record<string, string> {
  const url = req.url || ''
  const queryString = url.split('?')[1] || ''
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function parseAuthUser(req: IncomingMessage) {
  const authHeader = req.headers['authorization']
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    if (token.includes('store')) {
      return { role: 'store_manager', storeId: 'STORE-001', regionId: 'REG-001' }
    }
    if (token.includes('region')) {
      return { role: 'region_operation', regionId: '华东区' }
    }
    if (token.includes('hq')) {
      return { role: 'headquarters_operation' }
    }
  }
  return null
}

function buildContextFromRequest(req: IncomingMessage): QueryContext {
  const params = parseQueryParams(req)
  const user = parseAuthUser(req)

  return createQueryContext({
    storeIds: params.storeIds ? params.storeIds.split(',') : [],
    regionIds: params.regionIds ? params.regionIds.split(',') : [],
    chronicLabels: params.chronicLabels ? params.chronicLabels.split(',') : [],
    memberTiers: params.memberTier ? params.memberTier.split(',') : [],
    startDate: params.startDate,
    endDate: params.endDate,
    activityId: params.activityId,
    granularity: params.granularity as QueryContext['granularity'],
    cohortPeriod: params.cohortPeriod as QueryContext['cohortPeriod'],
    retentionPeriods: params.retentionPeriods ? parseInt(params.retentionPeriods) : undefined,
    targetCategories: params.targetCategories ? params.targetCategories.split(',') : [],
    userRole: user?.role,
    userStoreId: user?.storeId,
    userRegionId: user?.regionId,
  })
}

function sendJson(res: ServerResponse, data: unknown, statusCode = 200): void {
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = statusCode
  res.end(JSON.stringify(data))
}

function wrapClickHouseResult<T>(data: T, sampleSize: number) {
  return {
    code: 0,
    message: 'success',
    data: {
      data,
      sampleSize,
      lowSample: sampleSize < 10,
      queryId: 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
      executionTime: 50 + Math.floor(Math.random() * 250),
      rowsRead: Math.floor(Math.random() * 2000000 + 100000),
      bytesRead: Math.floor(Math.random() * 200 * 1024 * 1024 + 10 * 1024 * 1024),
    },
    requestId: 'req_' + Date.now().toString(36),
    timestamp: Date.now(),
  }
}

function extractSampleSize(data: unknown): number {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>
    if (typeof first.sampleSize === 'number') {
      return first.sampleSize
    }
    if (Array.isArray(first.cells) && first.cells.length > 0) {
      const cell = first.cells[0] as { sampleSize?: number }
      if (typeof cell.sampleSize === 'number') {
        return cell.sampleSize
      }
    }
    let total = 0
    data.forEach(item => {
      if (item && typeof item === 'object' && 'sampleSize' in item) {
        total += (item as { sampleSize: number }).sampleSize
      }
    })
    return Math.floor(total / data.length)
  }
  return 100
}

async function handleAnalyticsRoute(req: IncomingMessage, res: ServerResponse, endpoint: string): Promise<void> {
  const ctx = buildContextFromRequest(req)

  console.log(`[Backend API] ${endpoint}`, {
    userRole: ctx.userRole,
    storeIds: ctx.storeIds,
    chronicLabels: ctx.chronicLabels,
    sampleScale: ctx.storeIds.length > 0 ? `1/${Math.round(20 / ctx.storeIds.length)}` : '1/1',
  })

  let data: unknown
  switch (endpoint) {
    case '/analytics/core-metrics':
      data = generateCoreMetrics(ctx)
      break
    case '/analytics/cohort':
      data = generateCohortData(ctx)
      break
    case '/analytics/funnel':
      data = generateFunnelData(ctx)
      break
    case '/analytics/price-trend':
      data = generatePriceTrend(ctx)
      break
    case '/analytics/store-rank':
      data = generateStoreRank(ctx)
      break
    case '/analytics/medicine-comparison':
      data = generateMedicineComparison(ctx)
      break
    case '/analytics/prescription-ranges':
      data = generatePrescriptionRanges(ctx)
      break
    default:
      sendJson(res, { code: 404, message: 'Not Found' }, 404)
      return
  }

  const sampleSize = extractSampleSize(data)
  const response = wrapClickHouseResult(data, sampleSize)
  sendJson(res, response)
}

function apiMiddleware(server: ViteDevServer): void {
  server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
    const url = req.url || ''
    if (!url.startsWith(API_BASE)) {
      next()
      return
    }

    const endpoint = url.substring(API_BASE.length).split('?')[0]

    if (endpoint.startsWith('/analytics/')) {
      handleAnalyticsRoute(req, res, endpoint).catch(err => {
        console.error('[Backend API] Error:', err)
        sendJson(res, { code: 500, message: 'Internal Server Error' }, 500)
      })
      return
    }

    if (endpoint === '/health') {
      sendJson(res, { code: 0, message: 'ok', data: { status: 'healthy', mock: true } })
      return
    }

    sendJson(res, { code: 404, message: 'Endpoint not found: ' + endpoint }, 404)
  })
}

export function apiServerPlugin(): Plugin {
  return {
    name: 'pharmacy-api-server',
    configureServer(server: ViteDevServer) {
      apiMiddleware(server)
      console.log('\n✅  Pharmacy Analytics API Server started')
      console.log('   └── GET /api/v1/health')
      console.log('   └── GET /api/v1/analytics/core-metrics')
      console.log('   └── GET /api/v1/analytics/cohort')
      console.log('   └── GET /api/v1/analytics/funnel')
      console.log('   └── GET /api/v1/analytics/price-trend')
      console.log('   └── GET /api/v1/analytics/store-rank')
      console.log('   └── GET /api/v1/analytics/medicine-comparison')
      console.log('   └── GET /api/v1/analytics/prescription-ranges')
      console.log('   └── ClickHouse query simulation via Node.js backend\n')
    },
  }
}
