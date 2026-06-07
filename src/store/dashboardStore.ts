import { create } from 'zustand'

interface OverviewData {
  totalReturns: number
  avgRefundCycle: number
  returnRate: number
  anomalyRate: number
  sampleSize: number
}

interface ReasonNode {
  name: string
  value: number
  children?: ReasonNode[]
  anomalyRate?: number
}

interface CycleBin {
  range: string
  count: number
  isAnomaly: boolean
}

interface StageBreakdown {
  name: string
  avg: number
  p50: number
  p95: number
}

interface CycleData {
  distribution: CycleBin[]
  stages: StageBreakdown[]
  boxPlotData: { min: number; q1: number; median: number; q3: number; max: number }
}

interface ProductItem {
  id: string
  name: string
  returnRate: number
  returnCount: number
  refundAmount: number
  category: string
}

interface CSDurationStage {
  name: string
  value: number
  isAnomaly: boolean
}

interface SampleRecord {
  orderId: string
  product: string
  reason: string
  applyTime: string
  refundCycle: number
  isAnomaly: boolean
  csNote: string
}

interface GeoPoint {
  lng: number
  lat: number
  count: number
}

interface RepeatUser {
  hashedUserId: string
  returnCount: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface ExportTask {
  id: string
  format: 'CSV' | 'PDF'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  sampleSize: number
  dataUpdateTime: string
  createdAt: string
  completedAt?: string
  downloadUrl?: string
}

interface DataDictEntry {
  fieldName: string
  fieldType: string
  description: string
  caliber: string
}

interface MetricConfig {
  id: string
  name: string
  caliber: string
  formula: string
  editable: boolean
}

interface MissingValueRule {
  fieldName: string
  rule: '剔除' | '填充默认值' | '标记'
  defaultValue?: string
  missingCount: number
  missingRate: number
}

interface DashboardState {
  overview: OverviewData | null
  reasonTree: ReasonNode | null
  cycleDistribution: CycleData | null
  productRanking: ProductItem[]
  csDuration: CSDurationStage[]
  samples: SampleRecord[]
  geoHeatmap: GeoPoint[]
  repeatUsers: RepeatUser[]
  exportTasks: ExportTask[]
  dataDict: DataDictEntry[]
  metricConfigs: MetricConfig[]
  missingValueRules: MissingValueRule[]
  loading: {
    overview: boolean
    reasonTree: boolean
    cycleDistribution: boolean
    productRanking: boolean
    csDuration: boolean
    samples: boolean
    geoHeatmap: boolean
  }
  fetchOverview: () => Promise<void>
  fetchReasonTree: () => Promise<void>
  fetchCycleDistribution: () => Promise<void>
  fetchProductRanking: () => Promise<void>
  fetchCSDuration: () => Promise<void>
  fetchSamples: () => Promise<void>
  fetchGeoHeatmap: () => Promise<void>
  fetchRepeatUsers: () => Promise<void>
  fetchExportTasks: () => Promise<void>
  fetchDataDict: () => Promise<void>
  fetchMetricConfigs: () => Promise<void>
  fetchMissingValueRules: () => Promise<void>
}

const mockOverview: OverviewData = {
  totalReturns: 12847,
  avgRefundCycle: 5.3,
  returnRate: 8.7,
  anomalyRate: 3.2,
  sampleSize: 145832,
}

const mockReasonTree: ReasonNode = {
  name: '退货原因',
  value: 12847,
  children: [
    {
      name: '质量问题',
      value: 4230,
      anomalyRate: 5.1,
      children: [
        { name: '破损', value: 1820, anomalyRate: 7.2 },
        { name: '瑕疵', value: 1540, anomalyRate: 3.8 },
        { name: '功能故障', value: 870, anomalyRate: 6.5 },
      ],
    },
    {
      name: '物流问题',
      value: 3180,
      anomalyRate: 4.3,
      children: [
        { name: '延迟配送', value: 1450, anomalyRate: 3.1 },
        { name: '配送错误', value: 980, anomalyRate: 5.8 },
        { name: '包裹丢失', value: 750, anomalyRate: 8.9 },
      ],
    },
    {
      name: '描述不符',
      value: 2890,
      anomalyRate: 2.7,
      children: [
        { name: '尺寸不符', value: 1200, anomalyRate: 2.1 },
        { name: '颜色差异', value: 980, anomalyRate: 3.2 },
        { name: '材质不符', value: 710, anomalyRate: 2.8 },
      ],
    },
    {
      name: '主观原因',
      value: 2547,
      anomalyRate: 1.5,
      children: [
        { name: '不想要了', value: 1320, anomalyRate: 0.8 },
        { name: '买错了', value: 780, anomalyRate: 1.2 },
        { name: '价格变动', value: 447, anomalyRate: 2.5 },
      ],
    },
  ],
}

const mockCycleDistribution: CycleData = {
  distribution: [
    { range: '0-1天', count: 2340, isAnomaly: false },
    { range: '1-3天', count: 4560, isAnomaly: false },
    { range: '3-5天', count: 3210, isAnomaly: false },
    { range: '5-7天', count: 1580, isAnomaly: false },
    { range: '7-10天', count: 690, isAnomaly: true },
    { range: '10-15天', count: 320, isAnomaly: true },
    { range: '15-30天', count: 147, isAnomaly: true },
  ],
  stages: [
    { name: '申请→质检', avg: 1.8, p50: 1.5, p95: 3.2 },
    { name: '质检→审批', avg: 1.2, p50: 1.0, p95: 2.8 },
    { name: '审批→退款', avg: 2.3, p50: 2.0, p95: 4.5 },
  ],
  boxPlotData: { min: 0.5, q1: 2.0, median: 4.0, q3: 6.5, max: 28 },
}

const mockProductRanking: ProductItem[] = [
  { id: 'P001', name: '智能手表Pro', returnRate: 18.5, returnCount: 456, refundAmount: 136800, category: '电子产品' },
  { id: 'P002', name: '无线耳机Max', returnRate: 15.2, returnCount: 389, refundAmount: 97250, category: '电子产品' },
  { id: 'P003', name: '运动鞋轻量版', returnRate: 13.8, returnCount: 312, refundAmount: 74880, category: '鞋类' },
  { id: 'P004', name: '纯棉T恤经典款', returnRate: 12.1, returnCount: 278, refundAmount: 25020, category: '服装' },
  { id: 'P005', name: '保温杯500ml', returnRate: 11.7, returnCount: 245, refundAmount: 14700, category: '家居' },
  { id: 'P006', name: '蓝牙音箱Mini', returnRate: 10.9, returnCount: 223, refundAmount: 44600, category: '电子产品' },
  { id: 'P007', name: '瑜伽垫加厚款', returnRate: 10.3, returnCount: 198, refundAmount: 9900, category: '运动' },
  { id: 'P008', name: '真皮钱包', returnRate: 9.8, returnCount: 187, refundAmount: 37400, category: '配饰' },
  { id: 'P009', name: '儿童积木套装', returnRate: 9.2, returnCount: 165, refundAmount: 8250, category: '玩具' },
  { id: 'P010', name: '电动牙刷', returnRate: 8.7, returnCount: 154, refundAmount: 23100, category: '个护' },
  { id: 'P011', name: '空气净化器', returnRate: 8.3, returnCount: 142, refundAmount: 85200, category: '家电' },
  { id: 'P012', name: '笔记本电脑包', returnRate: 7.9, returnCount: 131, refundAmount: 7860, category: '箱包' },
  { id: 'P013', name: '护肤套装', returnRate: 7.5, returnCount: 120, refundAmount: 18000, category: '美妆' },
  { id: 'P014', name: '厨房刀具套装', returnRate: 7.1, returnCount: 109, refundAmount: 7630, category: '厨具' },
  { id: 'P015', name: '露营帐篷', returnRate: 6.8, returnCount: 98, refundAmount: 29400, category: '户外' },
  { id: 'P016', name: '机械键盘', returnRate: 6.4, returnCount: 92, refundAmount: 13800, category: '电子产品' },
  { id: 'P017', name: '宠物自动喂食器', returnRate: 6.1, returnCount: 85, refundAmount: 12750, category: '宠物' },
  { id: 'P018', name: '咖啡研磨机', returnRate: 5.8, returnCount: 79, refundAmount: 9480, category: '厨具' },
  { id: 'P019', name: '收纳箱三件套', returnRate: 5.3, returnCount: 72, refundAmount: 2880, category: '家居' },
  { id: 'P020', name: '充电宝20000mAh', returnRate: 5.0, returnCount: 68, refundAmount: 5440, category: '电子产品' },
]

const mockCSDuration: CSDurationStage[] = [
  { name: '申请受理', value: 0.8, isAnomaly: false },
  { name: '信息核验', value: 1.2, isAnomaly: false },
  { name: '物流追踪', value: 1.5, isAnomaly: true },
  { name: '质检评估', value: 0.9, isAnomaly: false },
  { name: '退款审批', value: 0.6, isAnomaly: false },
  { name: '财务打款', value: 0.3, isAnomaly: false },
]

const mockSamples: SampleRecord[] = Array.from({ length: 20 }, (_, i) => ({
  orderId: `ORD${String(100001 + i)}`,
  product: mockProductRanking[i % 20].name,
  reason: ['破损', '延迟配送', '尺寸不符', '不想要了'][i % 4],
  applyTime: `2026-05-${String(10 + i).padStart(2, '0')} 14:30`,
  refundCycle: Math.round((Math.random() * 12 + 0.5) * 10) / 10,
  isAnomaly: Math.random() > 0.7,
  csNote: ['正常处理', '需要加急', '物流异常跟进', ''][i % 4],
}))

const mockGeoHeatmap: GeoPoint[] = [
  { lng: 121.47, lat: 31.23, count: 2340 },
  { lng: 116.4, lat: 39.9, count: 1890 },
  { lng: 113.26, lat: 23.13, count: 1560 },
  { lng: 114.06, lat: 22.55, count: 1230 },
  { lng: 120.15, lat: 30.28, count: 980 },
  { lng: 104.07, lat: 30.67, count: 870 },
  { lng: 106.55, lat: 29.56, count: 760 },
  { lng: 114.3, lat: 30.6, count: 650 },
  { lng: 118.8, lat: 32.06, count: 540 },
  { lng: 117.0, lat: 36.67, count: 430 },
]

const mockRepeatUsers: RepeatUser[] = [
  { hashedUserId: 'U***a3f7', returnCount: 12, riskLevel: 'high' },
  { hashedUserId: 'U***b2e1', returnCount: 9, riskLevel: 'high' },
  { hashedUserId: 'U***c8d4', returnCount: 7, riskLevel: 'medium' },
  { hashedUserId: 'U***d1f9', returnCount: 6, riskLevel: 'medium' },
  { hashedUserId: 'U***e5a2', returnCount: 5, riskLevel: 'medium' },
  { hashedUserId: 'U***f7b3', returnCount: 4, riskLevel: 'low' },
  { hashedUserId: 'U***g2c6', returnCount: 3, riskLevel: 'low' },
  { hashedUserId: 'U***h8d1', returnCount: 3, riskLevel: 'low' },
]

const mockExportTasks: ExportTask[] = [
  { id: 'EXP001', format: 'CSV', status: 'completed', sampleSize: 145832, dataUpdateTime: '2026-06-07T08:00:00Z', createdAt: '2026-06-07T10:30:00Z', completedAt: '2026-06-07T10:31:20Z', downloadUrl: '/api/exports/EXP001/download' },
  { id: 'EXP002', format: 'PDF', status: 'processing', sampleSize: 89234, dataUpdateTime: '2026-06-08T08:00:00Z', createdAt: '2026-06-08T09:15:00Z' },
  { id: 'EXP003', format: 'CSV', status: 'pending', sampleSize: 52340, dataUpdateTime: '2026-06-08T08:00:00Z', createdAt: '2026-06-08T09:20:00Z' },
  { id: 'EXP004', format: 'PDF', status: 'failed', sampleSize: 12000, dataUpdateTime: '2026-06-06T08:00:00Z', createdAt: '2026-06-06T14:00:00Z' },
]

const mockDataDict: DataDictEntry[] = [
  { fieldName: 'orderId', fieldType: 'string', description: '订单编号', caliber: '系统自动生成唯一标识' },
  { fieldName: 'productId', fieldType: 'string', description: '商品ID', caliber: 'SKU级别唯一标识' },
  { fieldName: 'returnReason', fieldType: 'string', description: '退货原因', caliber: '用户选择的退货原因分类' },
  { fieldName: 'refundCycle', fieldType: 'number', description: '退款周期(天)', caliber: '从申请到退款到账的自然日' },
  { fieldName: 'isAnomaly', fieldType: 'boolean', description: '是否异常', caliber: '退款周期 > P95 或原因标记为异常' },
  { fieldName: 'warehouseId', fieldType: 'string', description: '仓库ID', caliber: '处理退货的仓库标识' },
  { fieldName: 'logisticsId', fieldType: 'string', description: '物流商ID', caliber: '承运退回物流的物流商标识' },
  { fieldName: 'applyTime', fieldType: 'datetime', description: '申请时间', caliber: '用户提交退货申请的时间戳' },
]

const mockMetricConfigs: MetricConfig[] = [
  { id: 'MC001', name: '退货率', caliber: '退货订单数 / 总订单数 × 100%', formula: 'returnCount / totalOrderCount * 100', editable: true },
  { id: 'MC002', name: '平均退款周期', caliber: '所有退款周期值的算术平均', formula: 'AVG(refundCycle)', editable: true },
  { id: 'MC003', name: '异常率', caliber: '异常订单数 / 退货订单数 × 100%', formula: 'anomalyCount / returnCount * 100', editable: true },
  { id: 'MC004', name: 'P95退款周期', caliber: '退款周期第95百分位数', formula: 'PERCENTILE(refundCycle, 0.95)', editable: false },
]

const mockMissingValueRules: MissingValueRule[] = [
  { fieldName: 'returnReason', rule: '填充默认值', defaultValue: '其他', missingCount: 234, missingRate: 1.8 },
  { fieldName: 'refundCycle', rule: '剔除', missingCount: 56, missingRate: 0.4 },
  { fieldName: 'logisticsId', rule: '标记', missingCount: 789, missingRate: 6.1 },
  { fieldName: 'csNote', rule: '填充默认值', defaultValue: '无备注', missingCount: 8923, missingRate: 69.4 },
  { fieldName: 'warehouseId', rule: '标记', missingCount: 123, missingRate: 0.96 },
]

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const useDashboardStore = create<DashboardState>((set) => ({
  overview: null,
  reasonTree: null,
  cycleDistribution: null,
  productRanking: [],
  csDuration: [],
  samples: [],
  geoHeatmap: [],
  repeatUsers: [],
  exportTasks: [],
  dataDict: [],
  metricConfigs: [],
  missingValueRules: [],
  loading: {
    overview: false,
    reasonTree: false,
    cycleDistribution: false,
    productRanking: false,
    csDuration: false,
    samples: false,
    geoHeatmap: false,
  },
  fetchOverview: async () => {
    set((s) => ({ loading: { ...s.loading, overview: true } }))
    await delay(400)
    set({ overview: mockOverview, loading: { ...useDashboardStore.getState().loading, overview: false } })
  },
  fetchReasonTree: async () => {
    set((s) => ({ loading: { ...s.loading, reasonTree: true } }))
    await delay(500)
    set({ reasonTree: mockReasonTree, loading: { ...useDashboardStore.getState().loading, reasonTree: false } })
  },
  fetchCycleDistribution: async () => {
    set((s) => ({ loading: { ...s.loading, cycleDistribution: true } }))
    await delay(450)
    set({ cycleDistribution: mockCycleDistribution, loading: { ...useDashboardStore.getState().loading, cycleDistribution: false } })
  },
  fetchProductRanking: async () => {
    set((s) => ({ loading: { ...s.loading, productRanking: true } }))
    await delay(350)
    set({ productRanking: mockProductRanking, loading: { ...useDashboardStore.getState().loading, productRanking: false } })
  },
  fetchCSDuration: async () => {
    set((s) => ({ loading: { ...s.loading, csDuration: true } }))
    await delay(300)
    set({ csDuration: mockCSDuration, loading: { ...useDashboardStore.getState().loading, csDuration: false } })
  },
  fetchSamples: async () => {
    set((s) => ({ loading: { ...s.loading, samples: true } }))
    await delay(300)
    set({ samples: mockSamples, loading: { ...useDashboardStore.getState().loading, samples: false } })
  },
  fetchGeoHeatmap: async () => {
    set((s) => ({ loading: { ...s.loading, geoHeatmap: true } }))
    await delay(350)
    set({ geoHeatmap: mockGeoHeatmap, loading: { ...useDashboardStore.getState().loading, geoHeatmap: false } })
  },
  fetchRepeatUsers: async () => {
    await delay(200)
    set({ repeatUsers: mockRepeatUsers })
  },
  fetchExportTasks: async () => {
    await delay(200)
    set({ exportTasks: mockExportTasks })
  },
  fetchDataDict: async () => {
    await delay(200)
    set({ dataDict: mockDataDict })
  },
  fetchMetricConfigs: async () => {
    await delay(200)
    set({ metricConfigs: mockMetricConfigs })
  },
  fetchMissingValueRules: async () => {
    await delay(200)
    set({ missingValueRules: mockMissingValueRules })
  },
}))
