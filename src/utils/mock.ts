import type {
  CoreMetric,
  CohortData,
  FunnelStep,
  StoreData,
  MemberTier,
  MedicineComparison,
  PriceTrendPoint,
  PrescriptionRangeStat,
  ChronicTag,
  MedicineCategory,
  StoreRankItem
} from '@/types'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export function generateCoreMetrics(): CoreMetric[] {
  return [
    {
      name: '会员总数',
      value: 125680,
      unit: '人',
      trend: 5.2,
      sampleSize: 125680,
      lowSample: false
    },
    {
      name: '月复购率',
      value: 32.5,
      unit: '%',
      trend: 2.1,
      sampleSize: 45620,
      lowSample: false
    },
    {
      name: '客单价',
      value: 168.5,
      unit: '元',
      trend: -1.3,
      sampleSize: 89250,
      lowSample: false
    },
    {
      name: '活动触达',
      value: 25680,
      unit: '人',
      trend: 12.8,
      sampleSize: 25680,
      lowSample: false
    }
  ]
}

export function generateCohortData(): CohortData[] {
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06']
  return months.map((month, idx) => {
    const baseSize = randomInt(500, 2000)
    const cells = []
    for (let i = 0; i < months.length - idx; i++) {
      const retention = Math.max(5, 60 - i * randomFloat(5, 10))
      const sampleSize = Math.floor(baseSize * (retention / 100))
      cells.push({
        period: i + 1,
        retentionRate: parseFloat(retention.toFixed(1)),
        sampleSize,
        lowSample: sampleSize < 10
      })
    }
    return { cohortPeriod: month, cells }
  })
}

export function generateFunnelData(): FunnelStep[] {
  return [
    { name: '优惠券领取', value: 15680, conversionRate: 100, sampleSize: 15680, lowSample: false },
    { name: '优惠券使用', value: 8920, conversionRate: 56.9, sampleSize: 8920, lowSample: false },
    { name: '首次复购', value: 5260, conversionRate: 58.9, sampleSize: 5260, lowSample: false },
    { name: '二次复购', value: 2840, conversionRate: 54.0, sampleSize: 2840, lowSample: false },
    { name: '活跃留存', value: 1560, conversionRate: 54.9, sampleSize: 1560, lowSample: false }
  ]
}

export function generateStoreData(): StoreData[] {
  const regions = ['华东区', '华北区', '华南区', '华中区', '西南区', '西北区', '东北区']
  const stores: StoreData[] = []
  for (let i = 1; i <= 20; i++) {
    const region = regions[randomInt(0, regions.length - 1)]
    const sampleSize = randomInt(500, 5000)
    stores.push({
      id: `STORE-${String(i).padStart(3, '0')}`,
      name: `${region}第${i}店`,
      region,
      repurchaseRate: randomFloat(20, 45),
      avgOrderValue: randomFloat(120, 220),
      totalSales: randomFloat(50, 200) * 10000,
      sampleSize
    })
  }
  return stores
}

export function generateMemberTiers(): MemberTier[] {
  return [
    { name: '钻石会员', count: 2568, percentage: 8.5, avgOrderValue: 358.2, repurchaseRate: 68.5, sampleSize: 2568, lowSample: false },
    { name: '黄金会员', count: 8920, percentage: 29.5, avgOrderValue: 218.6, repurchaseRate: 45.2, sampleSize: 8920, lowSample: false },
    { name: '白银会员', count: 12580, percentage: 41.6, avgOrderValue: 156.8, repurchaseRate: 28.9, sampleSize: 12580, lowSample: false },
    { name: '普通会员', count: 6180, percentage: 20.4, avgOrderValue: 98.5, repurchaseRate: 12.5, sampleSize: 6180, lowSample: false }
  ]
}

export function generateMedicineComparison(): MedicineComparison[] {
  const categories = ['感冒药', '降压药', '降糖药', '消化系统', '心脑血管', '维生素', '皮肤用药']
  return categories.map(cat => {
    const before = randomInt(500, 2000)
    const growth = randomFloat(-5, 25)
    const after = Math.floor(before * (1 + growth / 100))
    const sampleSize = randomInt(100, 1000)
    return {
      category: cat,
      beforeActivity: before,
      afterActivity: after,
      growthRate: growth,
      sampleSize,
      lowSample: sampleSize < 10
    }
  })
}

export function generatePriceTrend(): PriceTrendPoint[] {
  const points: PriceTrendPoint[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    points.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      avgOrderValue: randomFloat(140, 190),
      sampleSize: randomInt(5000, 15000),
      lowSample: false
    })
  }
  return points
}

export function generatePrescriptionStats(): PrescriptionRangeStat[] {
  return [
    { range: '0-10次', memberCount: 15680, percentage: 45.2, lowSample: false },
    { range: '10-20次', memberCount: 8920, percentage: 25.7, lowSample: false },
    { range: '20-50次', memberCount: 6580, percentage: 19.0, lowSample: false },
    { range: '50-100次', memberCount: 2560, percentage: 7.4, lowSample: false },
    { range: '100次以上', memberCount: 920, percentage: 2.7, lowSample: false }
  ]
}

export function generateStoreRank(): StoreRankItem[] {
  const regions = ['华东区', '华北区', '华南区', '华中区', '西南区', '西北区', '东北区']
  const stores: StoreRankItem[] = []
  for (let i = 1; i <= 20; i++) {
    const region = regions[randomInt(0, regions.length - 1)]
    const sampleSize = randomInt(500, 5000)
    stores.push({
      storeId: `STORE-${String(i).padStart(3, '0')}`,
      storeName: `${region}第${i}店`,
      region,
      repurchaseRate: randomFloat(20, 45),
      orderCount: randomInt(1000, 10000),
      sampleSize,
      lowSample: sampleSize < 10
    })
  }
  return stores.sort((a, b) => b.repurchaseRate - a.repurchaseRate)
}

export function generateChronicTags(): ChronicTag[] {
  return [
    { id: 'HT', name: '高血压', count: 25680 },
    { id: 'DM', name: '糖尿病', count: 18920 },
    { id: 'HL', name: '高血脂', count: 15680 },
    { id: 'CHD', name: '冠心病', count: 8560 },
    { id: 'CSLD', name: '慢性肝病', count: 5280 },
    { id: 'CKD', name: '慢性肾病', count: 4120 }
  ]
}

export function generateMedicineCategories(): MedicineCategory[] {
  const systemIds = ['SYS001', 'SYS002', 'SYS003', 'SYS004', 'SYS005']
  const systemNames = ['呼吸系统', '循环系统', '消化系统', '内分泌系统', '神经系统']
  
  const categories: MedicineCategory[] = []
  let subId = 1
  
  systemIds.forEach((sysId, idx) => {
    categories.push({
      id: sysId,
      name: systemNames[idx],
      parentId: null,
      level: 1,
      medicines: []
    })
    
    const subCount = randomInt(3, 5)
    for (let i = 0; i < subCount; i++) {
      const subCatId = `SUB${String(subId).padStart(3, '0')}`
      categories.push({
        id: subCatId,
        name: `${systemNames[idx]}子类${i + 1}`,
        parentId: sysId,
        level: 2,
        medicines: [`药品${subId * 10 + 1}`, `药品${subId * 10 + 2}`, `药品${subId * 10 + 3}`]
      })
      subId++
    }
  })
  
  return categories
}

export const defaultMedicineCategories: MedicineCategory[] = generateMedicineCategories()

export interface MockDataResult {
  coreMetrics: CoreMetric[]
  cohortData: CohortData[]
  funnelData: FunnelStep[]
  storeRank: StoreRankItem[]
  storeData: StoreData[]
  memberTiers: MemberTier[]
  medicineComparison: MedicineComparison[]
  priceTrend: PriceTrendPoint[]
  prescriptionRanges: PrescriptionRangeStat[]
  chronicTags: ChronicTag[]
  medicineCategories: MedicineCategory[]
}

export function generateMockData(): MockDataResult {
  return {
    coreMetrics: generateCoreMetrics(),
    cohortData: generateCohortData(),
    funnelData: generateFunnelData(),
    storeRank: generateStoreRank(),
    storeData: generateStoreData(),
    memberTiers: generateMemberTiers(),
    medicineComparison: generateMedicineComparison(),
    priceTrend: generatePriceTrend(),
    prescriptionRanges: generatePrescriptionStats(),
    chronicTags: generateChronicTags(),
    medicineCategories: generateMedicineCategories()
  }
}
