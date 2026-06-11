import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const hashPassword = (pw: string) => createHash('sha256').update(pw).digest('hex')

  await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      name: '管理员',
      password: hashPassword('admin123'),
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      phone: '13800000002',
      name: '运营小王',
      password: hashPassword('oper123'),
      role: 'OPERATOR',
    },
  })

  await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      name: '清洁阿姨',
      password: hashPassword('clean123'),
      role: 'CLEANER',
    },
  })

  await prisma.user.upsert({
    where: { phone: '13900001111' },
    update: {},
    create: {
      phone: '13900001111',
      name: '张三',
      password: hashPassword('guest123'),
      role: 'GUEST',
    },
  })

  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: '松间·大床房',
        type: 'KING',
        floor: 1,
        maxGuests: 2,
        amenities: ['WiFi', '空调', '独立卫浴', '茶具'],
        images: [],
        status: 'AVAILABLE',
        basePrice: 588,
      },
    }),
    prisma.room.create({
      data: {
        name: '竹影·大床房',
        type: 'KING',
        floor: 2,
        maxGuests: 2,
        amenities: ['WiFi', '空调', '独立卫浴', '浴缸', '阳台'],
        images: [],
        status: 'AVAILABLE',
        basePrice: 688,
      },
    }),
    prisma.room.create({
      data: {
        name: '清泉·双床房',
        type: 'TWIN',
        floor: 1,
        maxGuests: 3,
        amenities: ['WiFi', '空调', '独立卫浴', '书桌'],
        images: [],
        status: 'AVAILABLE',
        basePrice: 488,
      },
    }),
    prisma.room.create({
      data: {
        name: '山月·双床房',
        type: 'TWIN',
        floor: 2,
        maxGuests: 3,
        amenities: ['WiFi', '空调', '独立卫浴', '观景窗'],
        images: [],
        status: 'BOOKED',
        basePrice: 528,
      },
    }),
    prisma.room.create({
      data: {
        name: '云栖·家庭套房',
        type: 'SUITE',
        floor: 3,
        maxGuests: 4,
        amenities: ['WiFi', '空调', '独立卫浴', '客厅', '厨房', '观景露台'],
        images: [],
        status: 'AVAILABLE',
        basePrice: 1288,
      },
    }),
    prisma.room.create({
      data: {
        name: '溪谷·家庭套房',
        type: 'SUITE',
        floor: 3,
        maxGuests: 5,
        amenities: ['WiFi', '空调', '独立卫浴', '客厅', '壁炉', '花园'],
        images: [],
        status: 'OCCUPIED',
        basePrice: 1588,
      },
    }),
  ])

  const today = new Date()
  for (const room of rooms) {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      await prisma.roomInventory.create({
        data: {
          roomId: room.id,
          date,
          availableCount: i < 3 ? 0 : (room.type === 'SUITE' ? 1 : Math.floor(Math.random() * 2) + 1),
          totalCount: room.type === 'SUITE' ? 1 : 3,
          price: Number(room.basePrice) + (i >= 5 && i <= 10 ? 100 : 0),
          syncStatus: i < 5 ? 'SYNCED' : 'PENDING',
          lastSyncedAt: i < 5 ? new Date() : null,
        },
      })
    }
  }

  const sampleOrder = await prisma.order.create({
    data: {
      orderNo: 'BQ' + Date.now(),
      userId: 4,
      roomId: rooms[5].id,
      checkIn: today,
      checkOut: new Date(today.getTime() + 2 * 86400000),
      guestCount: 3,
      guestName: '张三',
      guestPhone: '13900001111',
      totalPrice: 1588 * 2,
      status: 'CHECKED_IN',
    },
  })

  await prisma.review.create({
    data: {
      orderId: sampleOrder.id,
      userId: 4,
      roomId: rooms[5].id,
      rating: 5,
      content: '非常棒的住宿体验！环境清幽，服务贴心，下次还会再来。',
      images: [],
      status: 'PENDING_REPLY',
    },
  })

  await prisma.todoItem.createMany({
    data: [
      {
        type: 'REVIEW_REPLY',
        title: '回复住客评价',
        description: '溪谷·家庭套房收到一条5星好评，请及时回复',
        priority: 'P2',
        status: 'PENDING',
        assigneeId: 2,
        relatedId: 1,
        relatedType: 'REVIEW',
        dueAt: new Date(Date.now() + 86400000),
      },
      {
        type: 'CLEANING',
        title: '溪谷·家庭套房清洁',
        description: '住客已退房，请尽快安排清洁',
        priority: 'P1',
        status: 'PENDING',
        assigneeId: 3,
        relatedId: rooms[5].id,
        relatedType: 'CLEANING',
        dueAt: new Date(Date.now() + 4 * 3600000),
      },
    ],
  })

  await prisma.reminderRule.createMany({
    data: [
      {
        name: '库存紧急不足',
        condition: { field: 'availableCount', operator: 'EQ', value: 0 },
        priority: 'P0',
        enabled: true,
      },
      {
        name: '空置率偏高',
        condition: { field: 'vacancyRate', operator: 'GT', value: 50 },
        priority: 'P1',
        enabled: true,
      },
      {
        name: '库存即将售罄',
        condition: { field: 'availableCount', operator: 'LTE', value: 1 },
        priority: 'P2',
        enabled: true,
      },
    ],
  })

  await prisma.reminder.createMany({
    data: [
      {
        ruleId: 1,
        priority: 'P0',
        title: '松间·大床房未来3天库存为零',
        message: '松间·大床房在接下来3天可售数量为0，请尽快补充库存或调整价格策略。',
        isRead: false,
      },
      {
        ruleId: 2,
        priority: 'P1',
        title: '本周空置率超过50%',
        message: '本周整体空置率达到52%，建议推出促销活动提升入住率。',
        isRead: false,
      },
    ],
  })

  console.log('Seed data created successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
