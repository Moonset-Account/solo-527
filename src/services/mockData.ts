import type { Merchant, Order, DistrictHeatData, Rectification } from '@/types'
import { cleanOrderData, type OrderRaw } from '@/utils/dataProcessor'
import { BUSINESS_DISTRICTS } from '@/constants'

const merchantNames = [
  '麦当劳(中关村店)',
  '肯德基(国贸店)',
  '星巴克(望京店)',
  '海底捞(三里屯店)',
  '必胜客(西单店)',
  '真功夫(王府井店)',
  '吉野家(中关村店)',
  '永和大王(国贸店)',
  '和合谷(望京店)',
  '南城香(三里屯店)',
  '西部马华(西单店)',
  '庆丰包子铺(王府井店)'
]

export function generateMockMerchants(): Merchant[] {
  return merchantNames.map((name, index) => ({
    id: `merchant_${index + 1}`,
    name,
    address: `${BUSINESS_DISTRICTS[index % BUSINESS_DISTRICTS.length]}xx路${index + 1}号`,
    longitude: 116.3 + (index % 6) * 0.05 + Math.random() * 0.02,
    latitude: 39.9 + Math.floor(index / 6) * 0.05 + Math.random() * 0.02,
    businessDistrict: BUSINESS_DISTRICTS[index % BUSINESS_DISTRICTS.length],
    avgPrepTime: 8 + Math.floor(Math.random() * 15),
    avgWaitTime: 3 + Math.floor(Math.random() * 12),
    orderCount: 200 + Math.floor(Math.random() * 500),
    refundRate: +(1 + Math.random() * 5).toFixed(1),
    dataGapCount: Math.floor(Math.random() * 20)
  }))
}

export function generateMockOrders(merchantId: string, count: number = 50): Order[] {
  const orders: Order[] = []
  const weathers = ['sunny', 'rainy', 'sunny', 'sunny', 'hot', 'rainy', 'foggy', 'windy']
  const periods = ['breakfast', 'lunch', 'lunch', 'afternoon', 'dinner', 'dinner', 'night', 'other']
  const riderRemarks = [
    '出餐口排队人多',
    '商户还没开始做',
    '餐品制作较慢',
    '商户忘单了',
    '取餐号混乱',
    undefined,
    undefined,
    undefined
  ]
  const refundReasons = [
    '出餐太慢取消',
    '餐品凉了',
    '送错餐',
    undefined
  ]

  for (let i = 0; i < count; i++) {
    const baseTime = new Date()
    baseTime.setDate(baseTime.getDate() - Math.floor(Math.random() * 7))
    baseTime.setHours(10 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60))

    const createTime = new Date(baseTime)
    const acceptTime = new Date(baseTime.getTime() + 1 * 60000 + Math.random() * 2 * 60000)
    const prepStartTime = new Date(acceptTime.getTime() + 3 * 60000 + Math.random() * 20 * 60000)
    
    const hasRiderArrive = Math.random() > 0.15
    const riderArriveTime = hasRiderArrive
      ? new Date(prepStartTime.getTime() + 2 * 60000 + Math.random() * 10 * 60000)
      : undefined
    
    const pickupTime = new Date(
      (riderArriveTime || prepStartTime).getTime() + 2 * 60000 + Math.random() * 15 * 60000
    )
    const deliverTime = new Date(pickupTime.getTime() + 10 * 60000 + Math.random() * 20 * 60000)

    const hasRefund = Math.random() < 0.08

    const raw: OrderRaw = {
      id: `order_${merchantId}_${i}`,
      merchantId,
      orderNo: `DD${Date.now()}${String(i).padStart(4, '0')}`,
      createTime: createTime.toISOString(),
      acceptTime: acceptTime.toISOString(),
      prepStartTime: prepStartTime.toISOString(),
      riderArriveTime: riderArriveTime?.toISOString(),
      pickupTime: pickupTime.toISOString(),
      deliverTime: deliverTime.toISOString(),
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      timePeriod: periods[Math.floor(Math.random() * periods.length)],
      riderRemark: riderRemarks[Math.floor(Math.random() * riderRemarks.length)],
      hasRefund,
      refundReason: hasRefund ? refundReasons[Math.floor(Math.random() * refundReasons.length)] : undefined
    }

    orders.push(cleanOrderData(raw))
  }

  return orders.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
}

export function generateDistrictHeatData(): DistrictHeatData[] {
  return BUSINESS_DISTRICTS.map((name, index) => ({
    name,
    value: 10 + Math.floor(Math.random() * 20),
    center: [
      116.3 + index * 0.05,
      39.9 + (index % 2) * 0.03
    ]
  }))
}

export function generateMockRectifications(merchantId: string): Rectification[] {
  const contents = [
    '已与商户沟通，要求增加出餐口人手，高峰时段安排专人打包',
    '建议商户优化备餐流程，热门菜品提前预制，减少等待时间',
    '已培训商户使用新的接单系统，及时处理订单避免漏单',
    '要求商户在爆单时段提前告知，平台可适当调整派单策略',
    '建议商户与骑手保持良好沟通，出餐进度及时同步'
  ]

  const rectifications: Rectification[] = []
  for (let i = 0; i < 3; i++) {
    const createTime = new Date()
    createTime.setDate(createTime.getDate() - i * 20 - Math.floor(Math.random() * 5))

    const beforeStart = new Date(createTime)
    beforeStart.setDate(beforeStart.getDate() - 14)
    const beforeEnd = new Date(createTime)
    beforeEnd.setDate(beforeEnd.getDate() - 1)

    const afterStart = new Date(createTime)
    afterStart.setDate(afterStart.getDate() + 1)
    const afterEnd = new Date(createTime)
    afterEnd.setDate(afterEnd.getDate() + 14)

    rectifications.push({
      id: `rect_${merchantId}_${i}`,
      merchantId,
      createTime: createTime.toISOString(),
      content: contents[i],
      operator: '运营专员' + ['A', 'B', 'C'][i],
      beforePeriodStart: beforeStart.toISOString(),
      beforePeriodEnd: beforeEnd.toISOString(),
      afterPeriodStart: afterStart.toISOString(),
      afterPeriodEnd: afterEnd.toISOString(),
      beforeMetrics: {
        avgPrepTime: 16 + Math.floor(Math.random() * 8),
        avgWaitTime: 10 + Math.floor(Math.random() * 6),
        orderCount: 200 + Math.floor(Math.random() * 200),
        timeoutRate: +(15 + Math.random() * 10).toFixed(1),
        refundRate: +(3 + Math.random() * 3).toFixed(1)
      },
      afterMetrics: {
        avgPrepTime: 10 + Math.floor(Math.random() * 6),
        avgWaitTime: 5 + Math.floor(Math.random() * 4),
        orderCount: 220 + Math.floor(Math.random() * 200),
        timeoutRate: +(5 + Math.random() * 8).toFixed(1),
        refundRate: +(1 + Math.random() * 2).toFixed(1)
      }
    })
  }

  return rectifications.sort(
    (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
  )
}

export const mockMerchants = generateMockMerchants()
export const mockDistrictHeat = generateDistrictHeatData()
export const merchantOrdersMap: Record<string, Order[]> = {}
export const merchantRectificationsMap: Record<string, Rectification[]> = {}

mockMerchants.forEach(m => {
  merchantOrdersMap[m.id] = generateMockOrders(m.id, 80)
  merchantRectificationsMap[m.id] = generateMockRectifications(m.id)
})
