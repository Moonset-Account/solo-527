export const mockRooms = [
  { id: 1, name: '松间·大床房', type: 'KING', floor: 1, maxGuests: 2, amenities: ['WiFi', '空调', '独立卫浴', '茶具'], images: [], status: 'AVAILABLE', basePrice: 588, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: '竹影·大床房', type: 'KING', floor: 2, maxGuests: 2, amenities: ['WiFi', '空调', '独立卫浴', '浴缸', '阳台'], images: [], status: 'AVAILABLE', basePrice: 688, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: '清泉·双床房', type: 'TWIN', floor: 1, maxGuests: 3, amenities: ['WiFi', '空调', '独立卫浴', '书桌'], images: [], status: 'AVAILABLE', basePrice: 488, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: '山月·双床房', type: 'TWIN', floor: 2, maxGuests: 3, amenities: ['WiFi', '空调', '独立卫浴', '观景窗'], images: [], status: 'BOOKED', basePrice: 528, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, name: '云栖·家庭套房', type: 'SUITE', floor: 3, maxGuests: 4, amenities: ['WiFi', '空调', '独立卫浴', '客厅', '厨房', '观景露台'], images: [], status: 'AVAILABLE', basePrice: 1288, createdAt: new Date(), updatedAt: new Date() },
  { id: 6, name: '溪谷·家庭套房', type: 'SUITE', floor: 3, maxGuests: 5, amenities: ['WiFi', '空调', '独立卫浴', '客厅', '壁炉', '花园'], images: [], status: 'OCCUPIED', basePrice: 1588, createdAt: new Date(), updatedAt: new Date() },
]

export function generateMockInventories(rooms: typeof mockRooms, days = 30) {
  const inventories: any[] = []
  const today = new Date()
  let invId = 1

  for (const room of rooms) {
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const totalCount = room.type === 'SUITE' ? 1 : 3
      const availableCount = i < 3 ? 0 : Math.min(totalCount, Math.floor(Math.random() * (totalCount + 1)))
      inventories.push({
        id: invId++,
        roomId: room.id,
        date: date.toISOString().split('T')[0],
        availableCount,
        totalCount,
        price: Number(room.basePrice) + (i >= 5 && i <= 10 ? 100 : 0),
        syncStatus: i < 5 ? 'SYNCED' : 'PENDING',
        lastSyncedAt: i < 5 ? new Date().toISOString() : null,
        room: { id: room.id, name: room.name, type: room.type },
      })
    }
  }
  return inventories
}

export const mockOrders = [
  { id: 1, orderNo: 'BQ1749700001', userId: 4, roomId: 6, checkIn: '2026-06-10', checkOut: '2026-06-12', guestCount: 3, guestName: '张三', guestPhone: '13900001111', totalPrice: 3176, status: 'CHECKED_IN', refundReason: null, createdAt: new Date(), updatedAt: new Date(), room: { id: 6, name: '溪谷·家庭套房', type: 'SUITE', basePrice: 1588 }, user: { id: 4, name: '张三', phone: '13900001111' } },
  { id: 2, orderNo: 'BQ1749700002', userId: 4, roomId: 1, checkIn: '2026-06-14', checkOut: '2026-06-16', guestCount: 2, guestName: '张三', guestPhone: '13900001111', totalPrice: 1176, status: 'PAID', refundReason: null, createdAt: new Date(), updatedAt: new Date(), room: { id: 1, name: '松间·大床房', type: 'KING', basePrice: 588 }, user: { id: 4, name: '张三', phone: '13900001111' } },
  { id: 3, orderNo: 'BQ1749700003', userId: 4, roomId: 3, checkIn: '2026-06-08', checkOut: '2026-06-09', guestCount: 2, guestName: '李四', guestPhone: '13900002222', totalPrice: 488, status: 'CHECKED_OUT', refundReason: null, createdAt: new Date(), updatedAt: new Date(), room: { id: 3, name: '清泉·双床房', type: 'TWIN', basePrice: 488 }, user: { id: 4, name: '张三', phone: '13900001111' } },
]

export const mockTodos = [
  { id: 1, type: 'REVIEW_REPLY', title: '回复住客评价', description: '溪谷·家庭套房收到一条5星好评，请及时回复', priority: 'P2', status: 'PENDING', assigneeId: 2, relatedId: 1, relatedType: 'REVIEW', dueAt: new Date(Date.now() + 86400000).toISOString(), completedAt: null, createdAt: new Date().toISOString(), assignee: { id: 2, name: '运营小王' } },
  { id: 2, type: 'CLEANING', title: '溪谷·家庭套房清洁', description: '住客已退房，请尽快安排清洁', priority: 'P1', status: 'PENDING', assigneeId: 3, relatedId: 6, relatedType: 'CLEANING', dueAt: new Date(Date.now() + 4 * 3600000).toISOString(), completedAt: null, createdAt: new Date().toISOString(), assignee: { id: 3, name: '清洁阿姨' } },
  { id: 3, type: 'REFUND_APPROVAL', title: '退款审批-李四', description: '李四申请退款，订单号 BQ1749700003', priority: 'P0', status: 'PENDING', assigneeId: 1, relatedId: 3, relatedType: 'ORDER', dueAt: new Date(Date.now() + 2 * 3600000).toISOString(), completedAt: null, createdAt: new Date().toISOString(), assignee: { id: 1, name: '管理员' } },
]

export const mockReminders = [
  { id: 1, ruleId: 1, priority: 'P0', title: '松间·大床房未来3天库存为零', message: '松间·大床房在接下来3天可售数量为0，请尽快补充库存或调整价格策略。', isRead: false, createdAt: new Date().toISOString(), rule: { id: 1, name: '库存紧急不足' } },
  { id: 2, ruleId: 2, priority: 'P1', title: '本周空置率超过50%', message: '本周整体空置率达到52%，建议推出促销活动提升入住率。', isRead: false, createdAt: new Date().toISOString(), rule: { id: 2, name: '空置率偏高' } },
  { id: 3, ruleId: 3, priority: 'P2', title: '部分房型库存即将售罄', message: '清泉·双床房剩余可售数量为1，请关注预订趋势。', isRead: true, createdAt: new Date().toISOString(), rule: { id: 3, name: '库存即将售罄' } },
]

export const mockReminderRules = [
  { id: 1, name: '库存紧急不足', condition: { field: 'availableCount', operator: 'EQ', value: 0 }, priority: 'P0', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: '空置率偏高', condition: { field: 'vacancyRate', operator: 'GT', value: 50 }, priority: 'P1', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: '库存即将售罄', condition: { field: 'availableCount', operator: 'LTE', value: 1 }, priority: 'P2', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

export const mockReviews = [
  { id: 1, orderId: 1, userId: 4, roomId: 6, rating: 5, content: '非常棒的住宿体验！环境清幽，服务贴心，下次还会再来。', images: [], reply: null, status: 'PENDING_REPLY', createdAt: new Date().toISOString(), user: { id: 4, name: '张三' } },
  { id: 2, orderId: 3, userId: 4, roomId: 3, rating: 4, content: '房间整洁，位置很好，就是隔音一般。', images: [], reply: '感谢您的好评，我们会改善隔音问题，期待您的再次光临！', status: 'REPLIED', createdAt: new Date().toISOString(), user: { id: 4, name: '张三' } },
]

export const mockDashboardStats = {
  totalRooms: 6,
  availableRooms: 3,
  occupancyRate: 50,
  pendingTodos: 3,
  p0Reminders: 1,
  todayCheckIns: 1,
  todayCheckOuts: 0,
  vacancyTrend: [
    { date: '2026-06-06', rate: 45 },
    { date: '2026-06-07', rate: 50 },
    { date: '2026-06-08', rate: 55 },
    { date: '2026-06-09', rate: 48 },
    { date: '2026-06-10', rate: 42 },
    { date: '2026-06-11', rate: 52 },
    { date: '2026-06-12', rate: 50 },
  ],
}

let _dbChecked = false
let _dbAvailable = false

export async function isDbAvailable(): Promise<boolean> {
  if (_dbChecked) return _dbAvailable
  try {
    const { prisma } = await import('~/server/utils/prisma')
    await prisma.$queryRaw`SELECT 1`
    _dbAvailable = true
  } catch {
    _dbAvailable = false
  }
  _dbChecked = true
  return _dbAvailable
}
