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

interface MockRoom {
  id: number
  name: string
  type: string
  floor: number
  maxGuests: number
  amenities: string[]
  images: string[]
  status: string
  basePrice: number
  createdAt: string
  updatedAt: string
}

interface MockInventory {
  id: number
  roomId: number
  date: string
  availableCount: number
  totalCount: number
  price: number
  syncStatus: string
  lastSyncedAt: string | null
  room?: { id: number; name: string; type: string }
}

interface MockOrder {
  id: number
  orderNo: string
  userId: number
  roomId: number
  checkIn: string
  checkOut: string
  guestCount: number
  guestName: string
  guestPhone: string
  totalPrice: number
  status: string
  refundReason: string | null
  createdAt: string
  updatedAt: string
  room?: { id: number; name: string; type: string; basePrice: number }
  user?: { id: number; name: string; phone: string }
}

interface MockTodo {
  id: number
  type: string
  title: string
  description: string
  priority: string
  status: string
  assigneeId: number
  relatedId: number
  relatedType: string
  dueAt: string | null
  completedAt: string | null
  createdAt: string
  assignee?: { id: number; name: string }
}

interface MockReminder {
  id: number
  ruleId: number | null
  priority: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  rule?: { id: number; name: string }
}

interface MockReminderRule {
  id: number
  name: string
  condition: Record<string, any>
  priority: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface MockReview {
  id: number
  orderId: number
  userId: number
  roomId: number
  rating: number
  content: string
  images: string[]
  reply: string | null
  status: string
  createdAt: string
  user?: { id: number; name: string }
}

class MockStore {
  rooms: MockRoom[] = [
    { id: 1, name: '松间·大床房', type: 'KING', floor: 1, maxGuests: 2, amenities: ['WiFi', '空调', '独立卫浴', '茶具'], images: [], status: 'AVAILABLE', basePrice: 588, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, name: '竹影·大床房', type: 'KING', floor: 2, maxGuests: 2, amenities: ['WiFi', '空调', '独立卫浴', '浴缸', '阳台'], images: [], status: 'AVAILABLE', basePrice: 688, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, name: '清泉·双床房', type: 'TWIN', floor: 1, maxGuests: 3, amenities: ['WiFi', '空调', '独立卫浴', '书桌'], images: [], status: 'CLEANING', basePrice: 488, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, name: '山月·双床房', type: 'TWIN', floor: 2, maxGuests: 3, amenities: ['WiFi', '空调', '独立卫浴', '观景窗'], images: [], status: 'BOOKED', basePrice: 528, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, name: '云栖·家庭套房', type: 'SUITE', floor: 3, maxGuests: 4, amenities: ['WiFi', '空调', '独立卫浴', '客厅', '厨房', '观景露台'], images: [], status: 'AVAILABLE', basePrice: 1288, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 6, name: '溪谷·家庭套房', type: 'SUITE', floor: 3, maxGuests: 5, amenities: ['WiFi', '空调', '独立卫浴', '客厅', '壁炉', '花园'], images: [], status: 'OCCUPIED', basePrice: 1588, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]

  inventories: MockInventory[] = []
  nextInventoryId = 1

  orders: MockOrder[] = []
  nextOrderId = 1

  todos: MockTodo[] = []
  nextTodoId = 1

  reminders: MockReminder[] = []
  nextReminderId = 1

  reminderRules: MockReminderRule[] = []
  nextRuleId = 1

  reviews: MockReview[] = []
  nextReviewId = 1

  vacancyRate: number = 50

  constructor() {
    this.initInventories()
    this.initOrders()
    this.initTodos()
    this.initReminders()
    this.initReminderRules()
    this.initReviews()
    this.updateVacancyRate()
  }

  initInventories() {
    const today = new Date()
    for (const room of this.rooms) {
      const totalCount = room.type === 'SUITE' ? 1 : 3
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        const availableCount = i < 3 ? 0 : Math.max(0, Math.floor(Math.random() * (totalCount + 1)))
        this.inventories.push({
          id: this.nextInventoryId++,
          roomId: room.id,
          date: date.toISOString().split('T')[0],
          availableCount,
          totalCount,
          price: room.basePrice + (i >= 5 && i <= 10 ? 100 : 0),
          syncStatus: i < 5 ? 'SYNCED' : 'PENDING',
          lastSyncedAt: i < 5 ? new Date().toISOString() : null,
          room: { id: room.id, name: room.name, type: room.type },
        })
      }
    }
  }

  initOrders() {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 86400000)
    const dayAfter = new Date(today.getTime() + 2 * 86400000)
    const pastDay = new Date(today.getTime() - 86400000)

    this.orders.push({
      id: this.nextOrderId++,
      orderNo: 'BQ' + (Date.now() - 100000),
      userId: 4,
      roomId: 6,
      checkIn: pastDay.toISOString().split('T')[0],
      checkOut: dayAfter.toISOString().split('T')[0],
      guestCount: 3,
      guestName: '张三',
      guestPhone: '13900001111',
      totalPrice: 1588 * 3,
      status: 'CHECKED_IN',
      refundReason: null,
      createdAt: pastDay.toISOString(),
      updatedAt: new Date().toISOString(),
      room: { id: 6, name: '溪谷·家庭套房', type: 'SUITE', basePrice: 1588 },
      user: { id: 4, name: '张三', phone: '13900001111' },
    })

    this.orders.push({
      id: this.nextOrderId++,
      orderNo: 'BQ' + (Date.now() - 50000),
      userId: 4,
      roomId: 1,
      checkIn: tomorrow.toISOString().split('T')[0],
      checkOut: new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0],
      guestCount: 2,
      guestName: '张三',
      guestPhone: '13900001111',
      totalPrice: 588 * 2,
      status: 'PAID',
      refundReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: { id: 1, name: '松间·大床房', type: 'KING', basePrice: 588 },
      user: { id: 4, name: '张三', phone: '13900001111' },
    })
  }

  initTodos() {
    this.todos.push({
      id: this.nextTodoId++,
      type: 'REVIEW_REPLY',
      title: '回复住客评价',
      description: '松间·大床房收到一条5星好评，请及时回复',
      priority: 'P2',
      status: 'PENDING',
      assigneeId: 2,
      relatedId: 1,
      relatedType: 'REVIEW',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: { id: 2, name: '运营小王' },
    })

    this.todos.push({
      id: this.nextTodoId++,
      type: 'CLEANING',
      title: '清泉·双床房清洁任务',
      description: '住客今日退房，请尽快安排清洁',
      priority: 'P1',
      status: 'PENDING',
      assigneeId: 3,
      relatedId: 3,
      relatedType: 'CLEANING',
      dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: { id: 3, name: '清洁阿姨' },
    })

    this.todos.push({
      id: this.nextTodoId++,
      type: 'REFUND_APPROVAL',
      title: '退款审批 - 山月·双床房',
      description: '住客申请退款，订单号 BQ123456789，请及时审批',
      priority: 'P0',
      status: 'PENDING',
      assigneeId: 1,
      relatedId: 2,
      relatedType: 'ORDER',
      dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: { id: 1, name: '管理员' },
    })
  }

  initReminders() {
    this.reminders.push({
      id: this.nextReminderId++,
      ruleId: 1,
      priority: 'P0',
      title: '松间·大床房未来3天库存为零',
      message: '松间·大床房在接下来3天可售数量为0，请尽快补充库存或调整价格策略。',
      isRead: false,
      createdAt: new Date().toISOString(),
      rule: { id: 1, name: '库存紧急不足' },
    })

    this.reminders.push({
      id: this.nextReminderId++,
      ruleId: 2,
      priority: 'P1',
      title: '本周空置率超过50%',
      message: '本周整体空置率达到52%，建议推出促销活动提升入住率。',
      isRead: false,
      createdAt: new Date().toISOString(),
      rule: { id: 2, name: '空置率偏高' },
    })

    this.reminders.push({
      id: this.nextReminderId++,
      ruleId: 3,
      priority: 'P2',
      title: '部分房型库存即将售罄',
      message: '清泉·双床房剩余可售数量为1，请关注预订趋势。',
      isRead: true,
      createdAt: new Date().toISOString(),
      rule: { id: 3, name: '库存即将售罄' },
    })
  }

  initReminderRules() {
    this.reminderRules.push({ id: this.nextRuleId++, name: '库存紧急不足', condition: { field: 'availableCount', operator: 'EQ', value: 0 }, priority: 'P0', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    this.reminderRules.push({ id: this.nextRuleId++, name: '空置率偏高', condition: { field: 'vacancyRate', operator: 'GT', value: 50 }, priority: 'P1', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    this.reminderRules.push({ id: this.nextRuleId++, name: '库存即将售罄', condition: { field: 'availableCount', operator: 'LTE', value: 1 }, priority: 'P2', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }

  initReviews() {
    this.reviews.push({
      id: this.nextReviewId++,
      orderId: 1,
      userId: 4,
      roomId: 6,
      rating: 5,
      content: '非常棒的住宿体验！环境清幽，服务贴心，下次还会再来。',
      images: [],
      reply: null,
      status: 'PENDING_REPLY',
      createdAt: new Date().toISOString(),
      user: { id: 4, name: '张三' },
    })

    this.reviews.push({
      id: this.nextReviewId++,
      orderId: 2,
      userId: 4,
      roomId: 3,
      rating: 4,
      content: '房间整洁，位置很好，就是隔音一般。',
      images: [],
      reply: '感谢您的好评，我们会改善隔音问题，期待您的再次光临！',
      status: 'REPLIED',
      createdAt: new Date().toISOString(),
      user: { id: 4, name: '张三' },
    })
  }

  updateVacancyRate() {
    const totalRooms = this.rooms.length
    const availableRooms = this.rooms.filter(r => r.status === 'AVAILABLE').length
    this.vacancyRate = Math.round((availableRooms / totalRooms) * 100)
  }

  createOrder(data: any): MockOrder {
    const room = this.rooms.find(r => r.id === data.roomId)
    if (!room) throw new Error('Room not found')

    const checkInDate = new Date(data.checkIn)
    const checkOutDate = new Date(data.checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights <= 0) throw new Error('Invalid date range')

    let totalPrice = 0
    const currentDate = new Date(checkInDate)
    while (currentDate < checkOutDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const inv = this.inventories.find(i => i.roomId === data.roomId && i.date === dateStr)
      if (!inv || inv.availableCount <= 0) {
        throw new Error(`Room not available on ${dateStr}`)
      }
      totalPrice += inv.price
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const order: MockOrder = {
      id: this.nextOrderId++,
      orderNo: 'BQ' + Date.now(),
      userId: data.userId || 4,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestCount: data.guestCount || 1,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      totalPrice,
      status: 'PAID',
      refundReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: { id: room.id, name: room.name, type: room.type, basePrice: room.basePrice },
      user: { id: 4, name: data.guestName, phone: data.guestPhone },
    }

    this.orders.unshift(order)

    const cd = new Date(checkInDate)
    while (cd < checkOutDate) {
      const ds = cd.toISOString().split('T')[0]
      const inv = this.inventories.find(i => i.roomId === data.roomId && i.date === ds)
      if (inv) {
        inv.availableCount = Math.max(0, inv.availableCount - 1)
        inv.syncStatus = 'PENDING'
        inv.lastSyncedAt = null
      }
      cd.setDate(cd.getDate() + 1)
    }

    return order
  }

  refundOrder(id: number, reason: string): MockOrder {
    const order = this.orders.find(o => o.id === id)
    if (!order) throw new Error('Order not found')
    order.status = 'REFUNDING'
    order.refundReason = reason
    order.updatedAt = new Date().toISOString()

    const refundTodo: MockTodo = {
      id: this.nextTodoId++,
      type: 'REFUND_APPROVAL',
      title: `退款审批 - ${order.room?.name || '房间'}`,
      description: `住客申请退款，订单号 ${order.orderNo}，原因：${reason}`,
      priority: 'P1',
      status: 'PENDING',
      assigneeId: 1,
      relatedId: order.id,
      relatedType: 'ORDER',
      dueAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: { id: 1, name: '管理员' },
    }
    this.todos.unshift(refundTodo)

    return order
  }

  completeTodo(id: number): { todo: MockTodo; vacancyUpdated: boolean } {
    const todo = this.todos.find(t => t.id === id)
    if (!todo) throw new Error('Todo not found')
    todo.status = 'COMPLETED'
    todo.completedAt = new Date().toISOString()

    let vacancyUpdated = false
    if (todo.type === 'CLEANING') {
      const room = this.rooms.find(r => r.id === todo.relatedId)
      if (room && room.status === 'CLEANING') {
        room.status = 'AVAILABLE'
        this.updateVacancyRate()
        vacancyUpdated = true
      }
      const today = new Date().toISOString().split('T')[0]
      const inv = this.inventories.find(i => i.roomId === todo.relatedId && i.date === today)
      if (inv) {
        inv.availableCount = inv.totalCount
      }
    }

    return { todo, vacancyUpdated }
  }

  markReminderRead(id: number): MockReminder {
    const reminder = this.reminders.find(r => r.id === id)
    if (!reminder) throw new Error('Reminder not found')
    reminder.isRead = true
    return reminder
  }

  createReview(data: any): MockReview {
    const review: MockReview = {
      id: this.nextReviewId++,
      orderId: data.orderId,
      userId: data.userId || 4,
      roomId: data.roomId,
      rating: data.rating,
      content: data.content,
      images: data.images || [],
      reply: null,
      status: 'PENDING_REPLY',
      createdAt: new Date().toISOString(),
      user: { id: 4, name: '住客' },
    }
    this.reviews.unshift(review)

    const replyTodo: MockTodo = {
      id: this.nextTodoId++,
      type: 'REVIEW_REPLY',
      title: `回复住客评价 - ${data.rating}星`,
      description: `收到${data.rating}星评价：${data.content.slice(0, 30)}...`,
      priority: 'P2',
      status: 'PENDING',
      assigneeId: 2,
      relatedId: review.id,
      relatedType: 'REVIEW',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      assignee: { id: 2, name: '运营小王' },
    }
    this.todos.unshift(replyTodo)

    return review
  }

  replyReview(id: number, reply: string): MockReview {
    const review = this.reviews.find(r => r.id === id)
    if (!review) throw new Error('Review not found')
    review.reply = reply
    review.status = 'REPLIED'
    return review
  }

  createReminderRule(data: any): MockReminderRule {
    const rule: MockReminderRule = {
      id: this.nextRuleId++,
      name: data.name,
      condition: data.condition,
      priority: data.priority,
      enabled: data.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.reminderRules.push(rule)
    return rule
  }

  updateReminderRule(id: number, data: any): MockReminderRule {
    const rule = this.reminderRules.find(r => r.id === id)
    if (!rule) throw new Error('Rule not found')
    if (data.name !== undefined) rule.name = data.name
    if (data.condition !== undefined) rule.condition = data.condition
    if (data.priority !== undefined) rule.priority = data.priority
    if (data.enabled !== undefined) rule.enabled = data.enabled
    rule.updatedAt = new Date().toISOString()
    return rule
  }

  updateInventory(id: number, data: any): MockInventory {
    const inv = this.inventories.find(i => i.id === id)
    if (!inv) throw new Error('Inventory not found')
    if (data.availableCount !== undefined) inv.availableCount = data.availableCount
    if (data.price !== undefined) inv.price = data.price
    if (data.syncStatus !== undefined) {
      inv.syncStatus = data.syncStatus
      if (data.syncStatus === 'SYNCED') {
        inv.lastSyncedAt = new Date().toISOString()
      }
    }
    return inv
  }

  syncInventories(roomIds?: number[], dateRange?: { start: string; end: string }): { synced: number } {
    let count = 0
    const start = dateRange?.start
    const end = dateRange?.end

    for (const inv of this.inventories) {
      if (roomIds && !roomIds.includes(inv.roomId)) continue
      if (start && inv.date < start) continue
      if (end && inv.date > end) continue
      inv.syncStatus = 'SYNCED'
      inv.lastSyncedAt = new Date().toISOString()
      count++
    }
    return { synced: count }
  }

  getDashboardStats() {
    const pendingTodos = this.todos.filter(t => t.status === 'PENDING').length
    const p0Reminders = this.reminders.filter(r => r.priority === 'P0' && !r.isRead).length
    const today = new Date().toISOString().split('T')[0]
    const todayCheckIns = this.orders.filter(o => o.checkIn === today && (o.status === 'PAID' || o.status === 'CHECKED_IN')).length
    const todayCheckOuts = this.orders.filter(o => o.checkOut === today && o.status === 'CHECKED_IN').length

    const trend = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      trend.push({
        date: d.toISOString().split('T')[0],
        rate: this.vacancyRate + Math.floor(Math.random() * 11) - 5,
      })
    }

    return {
      totalRooms: this.rooms.length,
      availableRooms: this.rooms.filter(r => r.status === 'AVAILABLE').length,
      occupancyRate: 100 - this.vacancyRate,
      vacancyRate: this.vacancyRate,
      pendingTodos,
      p0Reminders,
      todayCheckIns,
      todayCheckOuts,
      vacancyTrend: trend,
    }
  }
}

let _store: MockStore | null = null

export function useMockStore(): MockStore {
  if (!_store) {
    _store = new MockStore()
  }
  return _store
}
