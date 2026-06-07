import { v4 as uuidv4 } from 'uuid'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals))
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + rand() * (end.getTime() - start.getTime()))
}

export interface Shop {
  id: string
  name: string
  platform: string
}

export interface Product {
  id: string
  name: string
  category: string
  shopId: string
  price: number
  monthlySales: number
}

export interface ReasonNode {
  id: string
  name: string
  level: number
  parentId: string | null
}

export interface Warehouse {
  id: string
  name: string
  city: string
  lng: number
  lat: number
}

export interface LogisticsProvider {
  id: string
  name: string
  code: string
}

export interface CSStaff {
  id: string
  name: string
  role: string
}

export interface ReturnOrder {
  id: string
  orderId: string
  userHashId: string
  productId: string
  shopId: string
  reasonId: string
  warehouseId: string
  logisticsId: string
  csStaffId: string
  applyAt: string
  qualityCheckAt: string | null
  approveAt: string | null
  refundAt: string | null
  refundAmount: number
  status: 'pending' | 'quality_checking' | 'approved' | 'refunded' | 'rejected'
  csNote: string
  geoPoint: { lng: number; lat: number }
  isAnomaly: boolean
}

export interface CaliberConfig {
  id: string
  field: string
  caliber: string
  description: string
  isActive: boolean
}

export interface DataUpdateLog {
  id: string
  updateTime: string
  source: string
  recordCount: number
  status: string
}

export interface Annotation {
  id: string
  targetType: 'order' | 'product' | 'reason' | 'warehouse'
  targetId: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
}

export const shops: Shop[] = [
  { id: 'shop-001', name: '优品数码旗舰店', platform: '淘宝' },
  { id: 'shop-002', name: '潮流服饰专营店', platform: '淘宝' },
  { id: 'shop-003', name: '京东自营家电馆', platform: '京东' },
  { id: 'shop-004', name: '京东美妆旗舰店', platform: '京东' },
  { id: 'shop-005', name: '拼好货家居店', platform: '拼多多' },
  { id: 'shop-006', name: '多多食品专营', platform: '拼多多' },
  { id: 'shop-007', name: '抖快潮流百货', platform: '抖音' },
  { id: 'shop-008', name: '直播好物美妆', platform: '抖音' },
]

export const products: Product[] = [
  { id: 'prod-001', name: '无线蓝牙耳机 Pro', category: '电子产品', shopId: 'shop-001', price: 299, monthlySales: 1520 },
  { id: 'prod-002', name: '智能手表 S3', category: '电子产品', shopId: 'shop-001', price: 899, monthlySales: 830 },
  { id: 'prod-003', name: '快充数据线三合一', category: '电子产品', shopId: 'shop-001', price: 39, monthlySales: 4200 },
  { id: 'prod-004', name: '轻薄羽绒服女款', category: '服装', shopId: 'shop-002', price: 459, monthlySales: 2100 },
  { id: 'prod-005', name: '男士休闲卫衣', category: '服装', shopId: 'shop-002', price: 189, monthlySales: 1850 },
  { id: 'prod-006', name: '真丝连衣裙', category: '服装', shopId: 'shop-002', price: 699, monthlySales: 620 },
  { id: 'prod-007', name: '运动跑鞋透气款', category: '服装', shopId: 'shop-002', price: 329, monthlySales: 2800 },
  { id: 'prod-008', name: '滚筒洗衣机 8kg', category: '电子产品', shopId: 'shop-003', price: 2499, monthlySales: 420 },
  { id: 'prod-009', name: '变频空调 1.5匹', category: '电子产品', shopId: 'shop-003', price: 3299, monthlySales: 310 },
  { id: 'prod-010', name: '对开门冰箱 520L', category: '电子产品', shopId: 'shop-003', price: 4599, monthlySales: 180 },
  { id: 'prod-011', name: '兰蔻小黑瓶精华', category: '美妆', shopId: 'shop-004', price: 760, monthlySales: 950 },
  { id: 'prod-012', name: '雅诗兰黛眼霜', category: '美妆', shopId: 'shop-004', price: 510, monthlySales: 1200 },
  { id: 'prod-013', name: 'SK-II神仙水', category: '美妆', shopId: 'shop-004', price: 1190, monthlySales: 680 },
  { id: 'prod-014', name: '北欧风台灯', category: '家居', shopId: 'shop-005', price: 129, monthlySales: 3200 },
  { id: 'prod-015', name: '记忆棉枕头', category: '家居', shopId: 'shop-005', price: 159, monthlySales: 2600 },
  { id: 'prod-016', name: '不锈钢保温杯', category: '家居', shopId: 'shop-005', price: 79, monthlySales: 5100 },
  { id: 'prod-017', name: '全棉四件套', category: '家居', shopId: 'shop-005', price: 299, monthlySales: 1900 },
  { id: 'prod-018', name: '坚果礼盒装', category: '食品', shopId: 'shop-006', price: 128, monthlySales: 4300 },
  { id: 'prod-019', name: '进口牛奶12盒装', category: '食品', shopId: 'shop-006', price: 69, monthlySales: 6200 },
  { id: 'prod-020', name: '有机绿茶礼盒', category: '食品', shopId: 'shop-006', price: 198, monthlySales: 1800 },
  { id: 'prod-021', name: '便携蓝牙音箱', category: '电子产品', shopId: 'shop-007', price: 199, monthlySales: 2100 },
  { id: 'prod-022', name: '手机壳iPhone款', category: '电子产品', shopId: 'shop-007', price: 29, monthlySales: 8900 },
  { id: 'prod-023', name: '潮流棒球帽', category: '服装', shopId: 'shop-007', price: 59, monthlySales: 3400 },
  { id: 'prod-024', name: '网红防晒霜', category: '美妆', shopId: 'shop-008', price: 149, monthlySales: 5600 },
  { id: 'prod-025', name: '口红礼盒套装', category: '美妆', shopId: 'shop-008', price: 399, monthlySales: 2200 },
  { id: 'prod-026', name: '卸妆水大瓶装', category: '美妆', shopId: 'shop-008', price: 89, monthlySales: 4100 },
  { id: 'prod-027', name: '机械键盘青轴', category: '电子产品', shopId: 'shop-001', price: 349, monthlySales: 1100 },
  { id: 'prod-028', name: '儿童积木玩具', category: '家居', shopId: 'shop-005', price: 99, monthlySales: 2900 },
  { id: 'prod-029', name: '即食燕麦片', category: '食品', shopId: 'shop-006', price: 45, monthlySales: 7800 },
  { id: 'prod-030', name: '真丝睡衣套装', category: '服装', shopId: 'shop-002', price: 399, monthlySales: 950 },
]

export const reasonNodes: ReasonNode[] = [
  { id: 'reason-01', name: '质量问题', level: 1, parentId: null },
  { id: 'reason-01-01', name: '破损', level: 2, parentId: 'reason-01' },
  { id: 'reason-01-01-01', name: '运输破损', level: 3, parentId: 'reason-01-01' },
  { id: 'reason-01-01-02', name: '包装破损', level: 3, parentId: 'reason-01-01' },
  { id: 'reason-01-02', name: '质量缺陷', level: 2, parentId: 'reason-01' },
  { id: 'reason-01-02-01', name: '材质不符', level: 3, parentId: 'reason-01-02' },
  { id: 'reason-01-02-02', name: '功能异常', level: 3, parentId: 'reason-01-02' },
  { id: 'reason-01-02-03', name: '外观瑕疵', level: 3, parentId: 'reason-01-02' },
  { id: 'reason-02', name: '服务问题', level: 1, parentId: null },
  { id: 'reason-02-01', name: '态度问题', level: 2, parentId: 'reason-02' },
  { id: 'reason-02-01-01', name: '回复慢', level: 3, parentId: 'reason-02-01' },
  { id: 'reason-02-01-02', name: '态度差', level: 3, parentId: 'reason-02-01' },
  { id: 'reason-02-02', name: '承诺问题', level: 2, parentId: 'reason-02' },
  { id: 'reason-02-02-01', name: '未按承诺发货', level: 3, parentId: 'reason-02-02' },
  { id: 'reason-02-02-02', name: '虚假宣传', level: 3, parentId: 'reason-02-02' },
  { id: 'reason-03', name: '物流问题', level: 1, parentId: null },
  { id: 'reason-03-01', name: '配送延迟', level: 2, parentId: 'reason-03' },
  { id: 'reason-03-01-01', name: '超时未达', level: 3, parentId: 'reason-03-01' },
  { id: 'reason-03-01-02', name: '快递丢失', level: 3, parentId: 'reason-03-01' },
  { id: 'reason-03-02', name: '配送错误', level: 2, parentId: 'reason-03' },
  { id: 'reason-03-02-01', name: '送错地址', level: 3, parentId: 'reason-03-02' },
  { id: 'reason-03-02-02', name: '商品错发', level: 3, parentId: 'reason-03-02' },
  { id: 'reason-04', name: '需求变化', level: 1, parentId: null },
  { id: 'reason-04-01', name: '不想要了', level: 2, parentId: 'reason-04' },
  { id: 'reason-04-01-01', name: '不想要了', level: 3, parentId: 'reason-04-01' },
  { id: 'reason-04-01-02', name: '重复下单', level: 3, parentId: 'reason-04-01' },
  { id: 'reason-04-02', name: '规格不符', level: 2, parentId: 'reason-04' },
  { id: 'reason-04-02-01', name: '尺寸不合', level: 3, parentId: 'reason-04-02' },
  { id: 'reason-04-02-02', name: '颜色差异', level: 3, parentId: 'reason-04-02' },
]

export const warehouses: Warehouse[] = [
  { id: 'wh-001', name: '华东仓-上海', city: '上海', lng: 121.4737, lat: 31.2304 },
  { id: 'wh-002', name: '华南仓-广州', city: '广州', lng: 113.2644, lat: 23.1291 },
  { id: 'wh-003', name: '华北仓-北京', city: '北京', lng: 116.4074, lat: 39.9042 },
  { id: 'wh-004', name: '西南仓-成都', city: '成都', lng: 104.0665, lat: 30.5723 },
  { id: 'wh-005', name: '华中仓-武汉', city: '武汉', lng: 114.3055, lat: 30.5928 },
]

export const logisticsProviders: LogisticsProvider[] = [
  { id: 'log-001', name: '顺丰速运', code: 'SF' },
  { id: 'log-002', name: '中通快递', code: 'ZTO' },
  { id: 'log-003', name: '圆通速递', code: 'YTO' },
  { id: 'log-004', name: '韵达快递', code: 'YD' },
]

export const csStaff: CSStaff[] = [
  { id: 'cs-001', name: '张晓丽', role: '高级客服' },
  { id: 'cs-002', name: '王建国', role: '客服专员' },
  { id: 'cs-003', name: '李思雨', role: '客服专员' },
  { id: 'cs-004', name: '陈明辉', role: '高级客服' },
  { id: 'cs-005', name: '赵雅琪', role: '客服组长' },
  { id: 'cs-006', name: '刘伟强', role: '客服专员' },
]

const leafReasons = reasonNodes.filter((r) => r.level === 3)
const geoPoints = [
  { lng: 121.47, lat: 31.23 },
  { lng: 113.26, lat: 23.13 },
  { lng: 116.41, lat: 39.90 },
  { lng: 104.07, lat: 30.57 },
  { lng: 114.31, lat: 30.59 },
  { lng: 120.15, lat: 30.28 },
  { lng: 106.55, lat: 29.56 },
  { lng: 118.80, lat: 32.06 },
  { lng: 117.00, lat: 36.67 },
  { lng: 108.94, lat: 34.26 },
  { lng: 113.00, lat: 28.21 },
  { lng: 119.30, lat: 26.08 },
]

const csNotes = [
  '客户反馈商品存在质量问题，已安排退回检测',
  '客户要求加急处理，已优先安排质检',
  '客户情绪激动，已安抚并承诺尽快处理',
  '商品与描述严重不符，建议加强品控',
  '客户重复退换货，建议关注该用户',
  '正常退货流程，客户已寄回商品',
  '物流异常导致商品损坏，已联系物流方',
  '客户投诉虚假宣传，已转交相关部门',
  '仓库质检通过，已安排退款',
  '客户未寄回商品，已多次催促',
  '包装完好但商品有划痕，疑似出厂问题',
  '客户称未收到商品但物流显示已签收',
  '退货原因与实际情况不符，已标记异常',
  '客户要求换货但库存不足，改为退款',
  '批量退货订单，疑似刷单行为',
]

const repeatUserIds = Array.from({ length: 12 }, (_, i) => `user-repeat-${String(i + 1).padStart(3, '0')}`)
const normalUserIds = Array.from({ length: 80 }, (_, i) => `user-${String(i + 1).padStart(3, '0')}`)

const statusWeights: Array<ReturnOrder['status']> = [
  'refunded', 'refunded', 'refunded', 'refunded', 'refunded',
  'approved', 'approved',
  'quality_checking',
  'pending',
  'rejected',
]

function generateReturnOrders(): ReturnOrder[] {
  const orders: ReturnOrder[] = []
  const startDate = new Date('2025-12-01')
  const endDate = new Date('2026-05-31')

  for (let i = 0; i < 230; i++) {
    const isRepeat = rand() < 0.15
    const userId = isRepeat ? pick(repeatUserIds) : pick(normalUserIds)
    const product = pick(products)
    const applyDate = randomDate(startDate, endDate)
    const status = pick(statusWeights)
    const isAnomaly = rand() < 0.12

    let qualityCheckAt: string | null = null
    let approveAt: string | null = null
    let refundAt: string | null = null

    const qcDays = randInt(1, 5)
    const approveDays = randInt(0, 2)
    const refundDays = randInt(0, 3)

    if (status === 'quality_checking' || status === 'approved' || status === 'refunded' || status === 'rejected') {
      qualityCheckAt = new Date(applyDate.getTime() + qcDays * 86400000).toISOString()
    }
    if (status === 'approved' || status === 'refunded') {
      approveAt = new Date(new Date(qualityCheckAt!).getTime() + approveDays * 86400000).toISOString()
    }
    if (status === 'refunded') {
      refundAt = new Date(new Date(approveAt!).getTime() + refundDays * 86400000).toISOString()
    }

    const refundRate = randFloat(0.6, 1.0)
    const refundAmount = isAnomaly ? randFloat(product.price * 1.0, product.price * 1.5) : parseFloat((product.price * refundRate).toFixed(2))

    const baseGeo = pick(geoPoints)
    const geoPoint = {
      lng: parseFloat((baseGeo.lng + randFloat(-0.5, 0.5, 3)).toFixed(4)),
      lat: parseFloat((baseGeo.lat + randFloat(-0.5, 0.5, 3)).toFixed(4)),
    }

    orders.push({
      id: uuidv4(),
      orderId: `RET${String(i + 1).padStart(6, '0')}`,
      userHashId: userId,
      productId: product.id,
      shopId: product.shopId,
      reasonId: pick(leafReasons).id,
      warehouseId: pick(warehouses).id,
      logisticsId: pick(logisticsProviders).id,
      csStaffId: pick(csStaff).id,
      applyAt: applyDate.toISOString(),
      qualityCheckAt,
      approveAt,
      refundAt,
      refundAmount,
      status,
      csNote: pick(csNotes),
      geoPoint,
      isAnomaly,
    })
  }

  return orders
}

export const returnOrders: ReturnOrder[] = generateReturnOrders()

export const caliberConfigs: CaliberConfig[] = [
  { id: 'cal-001', field: '退款金额', caliber: '实际到账退款', description: '扣除优惠券、运费后的实际退款金额', isActive: true },
  { id: 'cal-002', field: '退款周期', caliber: '自然日', description: '从申请退款到退款到账的自然日数', isActive: true },
  { id: 'cal-003', field: '退货率', caliber: '订单维度', description: '退货订单数/总订单数（非商品维度）', isActive: true },
  { id: 'cal-004', field: '异常标记', caliber: '规则引擎', description: '退款金额>商品单价 或 同用户月退货>3次 或 退款周期>15天', isActive: true },
  { id: 'cal-005', field: '质检时长', caliber: '仓库签收到质检完成', description: '从仓库签收包裹到完成质检的小时数', isActive: true },
  { id: 'cal-006', field: '客服处理时长', caliber: '首次响应到完结', description: '从客户首次申请到客服标记完结的小时数', isActive: true },
]

export const dataUpdateLogs: DataUpdateLog[] = [
  { id: 'dul-001', updateTime: '2026-06-08T02:00:00.000Z', source: '淘宝开放平台', recordCount: 48, status: 'success' },
  { id: 'dul-002', updateTime: '2026-06-08T02:15:00.000Z', source: '京东API', recordCount: 35, status: 'success' },
  { id: 'dul-003', updateTime: '2026-06-08T02:30:00.000Z', source: '拼多多API', recordCount: 29, status: 'success' },
  { id: 'dul-004', updateTime: '2026-06-08T02:45:00.000Z', source: '抖音开放平台', recordCount: 22, status: 'success' },
  { id: 'dul-005', updateTime: '2026-06-07T02:00:00.000Z', source: '淘宝开放平台', recordCount: 41, status: 'success' },
  { id: 'dul-006', updateTime: '2026-06-07T02:15:00.000Z', source: '京东API', recordCount: 38, status: 'partial_failure' },
  { id: 'dul-007', updateTime: '2026-06-06T02:00:00.000Z', source: '全平台', recordCount: 134, status: 'success' },
]

export const annotations: Annotation[] = [
  { id: 'anno-001', targetType: 'order', targetId: returnOrders[0]?.orderId ?? '', content: '该订单疑似刷单退款，已标记异常', author: '赵雅琪', createdAt: '2026-06-07T10:30:00.000Z', updatedAt: '2026-06-07T10:30:00.000Z' },
  { id: 'anno-002', targetType: 'product', targetId: 'prod-004', content: '该款羽绒服近期退货率偏高，需关注品控', author: '陈明辉', createdAt: '2026-06-06T14:20:00.000Z', updatedAt: '2026-06-07T09:10:00.000Z' },
  { id: 'anno-003', targetType: 'reason', targetId: 'reason-01-01-01', content: '运输破损集中在华东仓，建议优化包装方案', author: '张晓丽', createdAt: '2026-06-05T16:45:00.000Z', updatedAt: '2026-06-05T16:45:00.000Z' },
  { id: 'anno-004', targetType: 'warehouse', targetId: 'wh-001', content: '华东仓质检人员不足，导致质检周期偏长', author: '王建国', createdAt: '2026-06-04T11:00:00.000Z', updatedAt: '2026-06-06T08:30:00.000Z' },
  { id: 'anno-005', targetType: 'product', targetId: 'prod-011', content: '该商品与供应商沟通后确认批次问题', author: '李思雨', createdAt: '2026-06-03T09:15:00.000Z', updatedAt: '2026-06-03T09:15:00.000Z' },
  { id: 'anno-006', targetType: 'order', targetId: returnOrders[5]?.orderId ?? '', content: '客户要求部分退款但系统全额退了，需修正', author: '刘伟强', createdAt: '2026-06-02T13:40:00.000Z', updatedAt: '2026-06-02T15:20:00.000Z' },
]

export function getLeafReasonIds(): string[] {
  return leafReasons.map((r) => r.id)
}

export function getAnomalyOrders(): ReturnOrder[] {
  return returnOrders.filter((o) => o.isAnomaly)
}

export function getRepeatUsers(): string[] {
  const countMap = new Map<string, number>()
  returnOrders.forEach((o) => {
    countMap.set(o.userHashId, (countMap.get(o.userHashId) ?? 0) + 1)
  })
  return [...countMap.entries()].filter(([, c]) => c > 1).map(([id]) => id)
}
