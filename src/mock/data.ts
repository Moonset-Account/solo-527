import type {
  ReturnRateTrend,
  KPIData,
  SKUReturnStats,
  LogisticsNodeStats,
  QualityConclusionStats,
  RefundByCurrency,
  WarehouseType,
  OrderRecord,
} from "@/types"

const SKU_CATALOG = [
  { sku: "SKU-001", name: "无线蓝牙耳机 Pro", category: "electronics" },
  { sku: "SKU-002", name: "智能手环 V3", category: "electronics" },
  { sku: "SKU-003", name: "便携式充电宝 20000mAh", category: "electronics" },
  { sku: "SKU-004", name: "手机壳 防摔款", category: "accessories" },
  { sku: "SKU-005", name: "真丝睡衣套装", category: "clothing" },
  { sku: "SKU-006", name: "婴儿纯棉连体衣", category: "clothing" },
  { sku: "SKU-007", name: "不锈钢保温杯 500ml", category: "home" },
  { sku: "SKU-008", name: "有机婴幼儿奶粉 3段", category: "food" },
  { sku: "SKU-009", name: "LED化妆镜 台式", category: "beauty" },
  { sku: "SKU-010", name: "瑜伽垫 加厚防滑", category: "sports" },
  { sku: "SKU-011", name: "电动牙刷 替换头", category: "personal_care" },
  { sku: "SKU-012", name: "宠物自动喂食器", category: "pet" },
  { sku: "SKU-013", name: "车载手机支架", category: "auto" },
  { sku: "SKU-014", name: "家用空气净化器", category: "home" },
  { sku: "SKU-015", name: "儿童积木玩具套装", category: "toys" },
  { sku: "SKU-016", name: "陶瓷餐具四件套", category: "home" },
  { sku: "SKU-017", name: "运动速干T恤", category: "clothing" },
  { sku: "SKU-018", name: "蓝牙音箱 迷你款", category: "electronics" },
]

const RETURN_REASONS = [
  "商品破损",
  "与描述不符",
  "质量问题",
  "尺码不合适",
  "颜色差异",
  "物流太慢",
  "包装损坏",
  "缺少配件",
  "功能故障",
  "不喜欢/不想要",
  "重复下单",
  "收到错误商品",
]

const LOGISTICS_NODES = [
  "仓库拣货",
  "国内运输",
  "出口清关",
  "国际运输",
  "进口清关",
  "目的国运输",
  "末端配送",
  "签收确认",
  "退货物流",
  "退货入库",
]

const CURRENCY_DATA = [
  { currency: "USD", exchangeRate: 1 },
  { currency: "EUR", exchangeRate: 1.08 },
  { currency: "GBP", exchangeRate: 1.27 },
  { currency: "JPY", exchangeRate: 0.0064 },
  { currency: "AUD", exchangeRate: 0.65 },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function generateReturnRateTrend(): ReturnRateTrend[] {
  const result: ReturnRateTrend[] = []
  const today = new Date()
  const rand = seededRandom(42)

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const weekday = date.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const weekendBoost = isWeekend ? 1.5 : 0

    const baseOverseas = 10 + Math.sin(i * 0.3) * 2.5
    const baseDomestic = 7 + Math.sin(i * 0.25) * 1.5

    const overseasRate = roundTo(
      Math.min(15, Math.max(8, baseOverseas + (rand() - 0.5) * 4 + weekendBoost)),
      1
    )
    const domesticRate = roundTo(
      Math.min(10, Math.max(5, baseDomestic + (rand() - 0.5) * 3 + weekendBoost * 0.5)),
      1
    )
    const overallRate = roundTo((overseasRate * 0.6 + domesticRate * 0.4), 1)

    result.push({
      date: formatDate(date),
      overseasRate,
      domesticRate,
      overallRate,
    })
  }

  return result
}

export function generateKPIData(warehouseType: WarehouseType): KPIData {
  const rand = seededRandom(warehouseType === "overseas" ? 100 : warehouseType === "domestic" ? 200 : 300)

  const configs: Record<WarehouseType, {
    returnRate: [number, number]
    refundUSD: [number, number]
    returnOrders: [number, number]
    processingDays: [number, number]
  }> = {
    overseas: {
      returnRate: [11, 14],
      refundUSD: [85000, 150000],
      returnOrders: [1800, 3200],
      processingDays: [8, 14],
    },
    domestic: {
      returnRate: [6, 9],
      refundUSD: [30000, 70000],
      returnOrders: [800, 1600],
      processingDays: [4, 7],
    },
    all: {
      returnRate: [9, 12],
      refundUSD: [120000, 210000],
      returnOrders: [2600, 4800],
      processingDays: [6, 11],
    },
  }

  const cfg = configs[warehouseType]
  const range = (min: number, max: number) => min + rand() * (max - min)

  return {
    totalReturnRate: roundTo(range(cfg.returnRate[0], cfg.returnRate[1]), 1),
    totalRefundUSD: roundTo(range(cfg.refundUSD[0], cfg.refundUSD[1]), 0),
    totalReturnOrders: Math.round(range(cfg.returnOrders[0], cfg.returnOrders[1])),
    avgProcessingDays: roundTo(range(cfg.processingDays[0], cfg.processingDays[1]), 1),
    returnRateTrend: roundTo((rand() - 0.4) * 6, 1),
    refundTrend: roundTo((rand() - 0.3) * 15, 1),
    orderTrend: roundTo((rand() - 0.35) * 10, 1),
    processingTrend: roundTo((rand() - 0.5) * 4, 1),
  }
}

export function generateSKURanking(warehouseType: WarehouseType): SKUReturnStats[] {
  const rand = seededRandom(warehouseType === "overseas" ? 500 : warehouseType === "domestic" ? 600 : 700)

  const overseasReturnRateRange = [8, 28] as const
  const domesticReturnRateRange = [4, 18] as const
  const rateRange = warehouseType === "domestic" ? domesticReturnRateRange : overseasReturnRateRange

  const normalSKUs: SKUReturnStats[] = []
  const lowSampleSKUs: SKUReturnStats[] = []

  for (let i = 0; i < SKU_CATALOG.length; i++) {
    const item = SKU_CATALOG[i]
    const isLowSample = i >= 13
    const totalOrders = isLowSample
      ? Math.floor(5 + rand() * 24)
      : Math.floor(80 + rand() * 420)

    const baseRate = rateRange[0] + rand() * (rateRange[1] - rateRange[0])
    const returnRate = roundTo(
      isLowSample ? baseRate * 1.2 : baseRate,
      1
    )

    const returnCount = Math.max(1, Math.round(totalOrders * returnRate / 100))

    const reasonCount = 2 + Math.floor(rand() * 3)
    const topReturnReasons: { reason: string; count: number }[] = []
    let remaining = returnCount

    for (let j = 0; j < reasonCount && remaining > 0; j++) {
      const isLast = j === reasonCount - 1
      const count = isLast ? remaining : Math.max(1, Math.floor(remaining * (0.3 + rand() * 0.4)))
      remaining -= count
      topReturnReasons.push({
        reason: RETURN_REASONS[Math.floor(rand() * RETURN_REASONS.length)],
        count,
      })
    }

    const stat: SKUReturnStats = {
      sku: item.sku,
      productName: item.name,
      totalOrders,
      returnCount,
      returnRate,
      isLowSample,
      topReturnReasons,
    }

    if (isLowSample) {
      lowSampleSKUs.push(stat)
    } else {
      normalSKUs.push(stat)
    }
  }

  normalSKUs.sort((a, b) => b.returnRate - a.returnRate)

  return [...normalSKUs, ...lowSampleSKUs]
}

export function generateSKUDetail(
  sku: string
): {
  sku: string
  productName: string
  totalOrders: number
  returnCount: number
  returnRate: number
  isLowSample: boolean
  topReturnReasons: { reason: string; count: number }[]
  logistics: LogisticsNodeStats[]
  qualityConclusions: QualityConclusionStats[]
  recentOrders: OrderRecord[]
} {
  const catalogItem = SKU_CATALOG.find((item) => item.sku === sku)
  const rand = seededRandom(sku.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0))

  const productName = catalogItem?.name ?? "未知商品"
  const totalOrders = Math.floor(100 + rand() * 400)
  const returnRate = roundTo(6 + rand() * 18, 1)
  const returnCount = Math.max(1, Math.round(totalOrders * returnRate / 100))
  const isLowSample = totalOrders < 30

  const reasonCount = 3 + Math.floor(rand() * 3)
  const topReturnReasons: { reason: string; count: number }[] = []
  let remaining = returnCount
  for (let j = 0; j < reasonCount && remaining > 0; j++) {
    const isLast = j === reasonCount - 1
    const count = isLast ? remaining : Math.max(1, Math.floor(remaining * (0.2 + rand() * 0.35)))
    remaining -= count
    topReturnReasons.push({
      reason: RETURN_REASONS[Math.floor(rand() * RETURN_REASONS.length)],
      count,
    })
  }

  const logistics: LogisticsNodeStats[] = LOGISTICS_NODES.slice(0, 8).map((node) => {
    const isInternationalNode = node.includes("清关") || node.includes("国际")
    const baseDelay = isInternationalNode ? 12 : 3
    const avgDelayHours = roundTo(baseDelay + rand() * (isInternationalNode ? 20 : 8), 1)
    const delayRate = roundTo(isInternationalNode ? 15 + rand() * 25 : 5 + rand() * 15, 1)
    const returnRate = roundTo(3 + delayRate * 0.3 + rand() * 5, 1)
    return {
      node,
      avgDelayHours,
      delayRate,
      returnRate,
      orderCount: Math.floor(50 + rand() * 300),
    }
  })

  const warehouseDamageCount = Math.floor(returnCount * (0.15 + rand() * 0.25))
  const consumerReasonCount = Math.floor(returnCount * (0.4 + rand() * 0.2))
  const otherCount = returnCount - warehouseDamageCount - consumerReasonCount

  const qualityConclusions: QualityConclusionStats[] = [
    {
      conclusion: "warehouse_damage",
      conclusionLabel: "仓库损坏",
      count: warehouseDamageCount,
      percentage: roundTo((warehouseDamageCount / returnCount) * 100, 1),
      totalRefundUSD: roundTo(warehouseDamageCount * (15 + rand() * 35), 2),
    },
    {
      conclusion: "consumer_reason",
      conclusionLabel: "消费者原因",
      count: consumerReasonCount,
      percentage: roundTo((consumerReasonCount / returnCount) * 100, 1),
      totalRefundUSD: roundTo(consumerReasonCount * (10 + rand() * 25), 2),
    },
    {
      conclusion: "other",
      conclusionLabel: "其他",
      count: otherCount,
      percentage: roundTo((otherCount / returnCount) * 100, 1),
      totalRefundUSD: roundTo(otherCount * (8 + rand() * 20), 2),
    },
  ]

  const warehouseNames = ["洛杉矶海外仓", "东京海外仓", "伦敦海外仓", "深圳国内仓", "杭州国内仓"]
  const recentOrders: OrderRecord[] = []
  for (let i = 0; i < 5; i++) {
    const isOverseas = rand() > 0.4
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - Math.floor(rand() * 30))
    const returnDate = new Date(orderDate)
    returnDate.setDate(returnDate.getDate() + Math.floor(3 + rand() * 10))

    const refundAmount = roundTo(10 + rand() * 90, 2)
    const currencyInfo = CURRENCY_DATA[Math.floor(rand() * CURRENCY_DATA.length)]

    recentOrders.push({
      orderId: `ORD-${Date.now()}-${Math.floor(rand() * 10000)}`,
      sku,
      warehouseType: isOverseas ? "overseas" : "domestic",
      warehouseName: warehouseNames[Math.floor(rand() * warehouseNames.length)],
      logisticsNode: LOGISTICS_NODES[Math.floor(rand() * LOGISTICS_NODES.length)],
      logisticsDelayHours: roundTo(rand() * 48, 1),
      returnReason: RETURN_REASONS[Math.floor(rand() * RETURN_REASONS.length)],
      qualityConclusion: (["warehouse_damage", "consumer_reason", "other"] as const)[Math.floor(rand() * 3)],
      refundAmount: currencyInfo.currency === "USD" ? refundAmount : roundTo(refundAmount / currencyInfo.exchangeRate, 2),
      refundCurrency: currencyInfo.currency,
      refundAmountUSD: refundAmount,
      orderDate: formatDate(orderDate),
      returnDate: formatDate(returnDate),
    })
  }

  return {
    sku,
    productName,
    totalOrders,
    returnCount,
    returnRate,
    isLowSample,
    topReturnReasons,
    logistics,
    qualityConclusions,
    recentOrders,
  }
}

export function generateLogisticsCorrelation(warehouseType: WarehouseType): LogisticsNodeStats[] {
  const rand = seededRandom(warehouseType === "overseas" ? 800 : warehouseType === "domestic" ? 900 : 1000)

  const nodeCount = 8 + Math.floor(rand() * 3)
  const nodes = LOGISTICS_NODES.slice(0, nodeCount)

  return nodes.map((node) => {
    const isInternationalNode = node.includes("清关") || node.includes("国际")
    const isOverseas = warehouseType === "overseas" || (warehouseType === "all" && rand() > 0.5)

    let baseDelay: number
    let baseDelayRate: number

    if (isOverseas && isInternationalNode) {
      baseDelay = 18 + rand() * 16
      baseDelayRate = 20 + rand() * 20
    } else if (isInternationalNode) {
      baseDelay = 10 + rand() * 12
      baseDelayRate = 12 + rand() * 15
    } else {
      baseDelay = 2 + rand() * 6
      baseDelayRate = 5 + rand() * 10
    }

    const avgDelayHours = roundTo(baseDelay, 1)
    const delayRate = roundTo(baseDelayRate, 1)
    const returnRate = roundTo(2 + delayRate * 0.25 + rand() * 4, 1)

    return {
      node,
      avgDelayHours,
      delayRate,
      returnRate,
      orderCount: Math.floor(100 + rand() * 500),
    }
  })
}

export function generateQualityDistribution(warehouseType: WarehouseType): QualityConclusionStats[] {
  const rand = seededRandom(warehouseType === "overseas" ? 1100 : warehouseType === "domestic" ? 1200 : 1300)

  const totalOrders = warehouseType === "overseas"
    ? 3500 + Math.floor(rand() * 1000)
    : warehouseType === "domestic"
      ? 1500 + Math.floor(rand() * 600)
      : 5000 + Math.floor(rand() * 1200)

  const isOverseas = warehouseType === "overseas" || (warehouseType === "all" && rand() > 0.5)

  const warehouseDamagePct = isOverseas ? roundTo(25 + rand() * 12, 1) : roundTo(12 + rand() * 8, 1)
  const consumerReasonPct = roundTo(45 + rand() * 10, 1)
  const otherPct = roundTo(100 - warehouseDamagePct - consumerReasonPct, 1)

  const warehouseDamageCount = Math.round(totalOrders * warehouseDamagePct / 100)
  const consumerReasonCount = Math.round(totalOrders * consumerReasonPct / 100)
  const otherCount = totalOrders - warehouseDamageCount - consumerReasonCount

  const avgRefundPerOrder = (count: number): number => {
    const base = 12 + rand() * 28
    return roundTo(count * base, 2)
  }

  return [
    {
      conclusion: "warehouse_damage",
      conclusionLabel: "仓库损坏",
      count: warehouseDamageCount,
      percentage: warehouseDamagePct,
      totalRefundUSD: avgRefundPerOrder(warehouseDamageCount),
    },
    {
      conclusion: "consumer_reason",
      conclusionLabel: "消费者原因",
      count: consumerReasonCount,
      percentage: consumerReasonPct,
      totalRefundUSD: avgRefundPerOrder(consumerReasonCount),
    },
    {
      conclusion: "other",
      conclusionLabel: "其他",
      count: otherCount,
      percentage: otherPct,
      totalRefundUSD: avgRefundPerOrder(otherCount),
    },
  ]
}

export function generateRefundReport(warehouseType: WarehouseType): RefundByCurrency[] {
  const rand = seededRandom(warehouseType === "overseas" ? 1400 : warehouseType === "domestic" ? 1500 : 1600)

  const multiplier = warehouseType === "overseas" ? 1.6 : warehouseType === "domestic" ? 0.6 : 1.0

  const amountRanges: Record<string, [number, number]> = {
    USD: [50000, 95000],
    EUR: [30000, 65000],
    GBP: [20000, 45000],
    JPY: [5000000, 12000000],
    AUD: [15000, 35000],
  }

  return CURRENCY_DATA.map(({ currency, exchangeRate }) => {
    const [min, max] = amountRanges[currency]
    const originalAmount = roundTo((min + rand() * (max - min)) * multiplier, 2)
    const convertedUSD = roundTo(originalAmount * exchangeRate, 2)
    return {
      currency,
      originalAmount,
      convertedUSD,
      exchangeRate,
    }
  })
}
