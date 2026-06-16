import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成种子数据...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800138000',
      email: 'admin@example.com'
    }
  })

  const internal = await prisma.user.upsert({
    where: { username: 'internal' },
    update: {},
    create: {
      username: 'internal',
      password: hashedPassword,
      name: '内部运营',
      role: 'INTERNAL',
      phone: '13800138001',
      email: 'internal@example.com'
    }
  })

  const organizer = await prisma.user.upsert({
    where: { username: 'organizer' },
    update: {},
    create: {
      username: 'organizer',
      password: hashedPassword,
      name: '活动主办方',
      role: 'ORGANIZER',
      phone: '13800138002',
      email: 'organizer@example.com'
    }
  })

  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '2024夏日音乐节',
      description: '一年一度的夏日音乐盛典，汇聚国内外顶尖音乐人',
      venue: '上海梅赛德斯奔驰文化中心',
      startTime: new Date('2024-08-15T18:00:00'),
      endTime: new Date('2024-08-15T22:00:00'),
      status: 'ON_SALE',
      organizerId: organizer.id
    }
  })

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '周杰伦嘉年华世界巡回演唱会',
      description: '周杰伦2024世界巡回演唱会上海站',
      venue: '上海体育场',
      startTime: new Date('2024-09-20T19:30:00'),
      endTime: new Date('2024-09-20T22:30:00'),
      status: 'ON_SALE',
      organizerId: organizer.id
    }
  })

  const session1 = await prisma.session.create({
    data: {
      eventId: event1.id,
      name: 'Day 1 - 主舞台',
      startTime: new Date('2024-08-15T18:00:00'),
      endTime: new Date('2024-08-15T22:00:00'),
      totalSeats: 500,
      soldSeats: 320,
      checkedIn: 280
    }
  })

  const session2 = await prisma.session.create({
    data: {
      eventId: event2.id,
      name: '第一场',
      startTime: new Date('2024-09-20T19:30:00'),
      endTime: new Date('2024-09-20T22:30:00'),
      totalSeats: 3000,
      soldSeats: 2800,
      checkedIn: 0
    }
  })

  const ticket1 = await prisma.ticket.create({
    data: {
      eventId: event1.id,
      name: '普通票',
      type: 'NORMAL',
      price: 299,
      quantity: 300,
      sold: 280,
      description: '普通观演区域'
    }
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      eventId: event1.id,
      name: 'VIP票',
      type: 'VIP',
      price: 699,
      quantity: 100,
      sold: 40,
      description: 'VIP观演区域，含周边礼包'
    }
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      eventId: event2.id,
      name: '内场票',
      type: 'INNER',
      price: 1280,
      quantity: 500,
      sold: 500,
      description: '内场近距离观演'
    }
  })

  const ticket4 = await prisma.ticket.create({
    data: {
      eventId: event2.id,
      name: '看台票',
      type: 'STAND',
      price: 580,
      quantity: 2500,
      sold: 2300,
      description: '看台观演区域'
    }
  })

  const rows = ['A', 'B', 'C', 'D', 'E']
  const seatsToCreate = []
  for (let r = 0; r < rows.length; r++) {
    for (let n = 1; n <= 10; n++) {
      const isSold = Math.random() > 0.4
      seatsToCreate.push({
        sessionId: session1.id,
        row: rows[r],
        number: n.toString().padStart(2, '0'),
        zone: r < 2 ? 'VIP' : '普通',
        price: r < 2 ? 699 : 299,
        status: isSold ? 'SOLD' : 'AVAILABLE'
      })
    }
  }
  await prisma.seat.createMany({ data: seatsToCreate })

  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD20240801001',
      userId: organizer.id,
      eventId: event1.id,
      totalAmount: 598,
      status: 'PAID',
      paymentMethod: 'ALIPAY',
      paidAt: new Date('2024-07-15T10:30:00'),
      sourceOrder: 'EXT00123456',
      remark: '公司团建购票',
      items: {
        create: [
          {
            ticketId: ticket1.id,
            sessionId: session1.id,
            seatId: 1,
            seatName: 'A区01号',
            ticketName: '普通票',
            price: 299,
            quantity: 1
          },
          {
            ticketId: ticket1.id,
            sessionId: session1.id,
            seatId: 2,
            seatName: 'A区02号',
            ticketName: '普通票',
            price: 299,
            quantity: 1
          }
        ]
      }
    },
    include: { items: true }
  })

  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD20240801002',
      userId: organizer.id,
      eventId: event1.id,
      totalAmount: 699,
      status: 'PAID',
      paymentMethod: 'WECHAT',
      paidAt: new Date('2024-07-16T14:20:00'),
      sourceOrder: 'EXT00123457',
      items: {
        create: [
          {
            ticketId: ticket2.id,
            sessionId: session1.id,
            ticketName: 'VIP票',
            price: 699,
            quantity: 1
          }
        ]
      }
    },
    include: { items: true }
  })

  await prisma.checkIn.createMany({
    data: [
      {
        orderId: order1.id,
        orderItemId: order1.items[0].id,
        eventId: event1.id,
        sessionId: session1.id,
        userId: organizer.id,
        operatorId: internal.id,
        status: 'SUCCESS',
        checkedInAt: new Date('2024-08-15T18:05:00'),
        sourceOrder: 'EXT00123456'
      },
      {
        orderId: order1.id,
        orderItemId: order1.items[1].id,
        eventId: event1.id,
        sessionId: session1.id,
        userId: organizer.id,
        operatorId: internal.id,
        status: 'SUCCESS',
        checkedInAt: new Date('2024-08-15T18:06:00'),
        sourceOrder: 'EXT00123456'
      }
    ]
  })

  await prisma.revenueLog.createMany({
    data: [
      {
        eventId: event1.id,
        orderId: order1.id,
        type: 'SALE',
        amount: 598,
        balance: 598,
        description: '订单 ORD20240801001 购票收入',
        sourceOrder: 'EXT00123456',
        operatorId: organizer.id
      },
      {
        eventId: event1.id,
        orderId: order2.id,
        type: 'SALE',
        amount: 699,
        balance: 1297,
        description: '订单 ORD20240801002 购票收入',
        sourceOrder: 'EXT00123457',
        operatorId: organizer.id
      }
    ]
  })

  await prisma.feedback.createMany({
    data: [
      {
        eventId: event1.id,
        orderId: order1.id,
        userId: organizer.id,
        rating: 5,
        content: '音响效果非常棒，现场氛围很好！',
        feedbackType: 'PERFORMANCE',
        sourceOrder: 'EXT00123456',
        handleRemark: '已记录，感谢反馈'
      },
      {
        eventId: event1.id,
        orderId: order2.id,
        userId: organizer.id,
        rating: 4,
        content: '座位视野不错，就是进场排队有点久',
        feedbackType: 'VENUE',
        sourceOrder: 'EXT00123457'
      }
    ]
  })

  await prisma.todo.createMany({
    data: [
      {
        userId: internal.id,
        title: '处理核销失败 - ORD20240801003',
        description: '核销失败原因：票券状态异常，请核实处理',
        status: 'PENDING',
        priority: 'HIGH',
        relatedType: 'CHECKIN',
        relatedId: 3,
        dueDate: new Date('2024-08-16T18:00:00')
      },
      {
        userId: internal.id,
        title: '审核退款申请 - ORD20240801004',
        description: '用户申请退款，原因：行程变更',
        status: 'PENDING',
        priority: 'MEDIUM',
        relatedType: 'REFUND',
        relatedId: 1
      },
      {
        userId: internal.id,
        title: '汇总8月活动到场数据',
        description: '需要在8月底前完成所有活动的到场数据汇总',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date('2024-08-31T23:59:59')
      },
      {
        userId: internal.id,
        title: '已完成的待办示例',
        description: '这是一个已完成的待办事项',
        status: 'DONE',
        priority: 'LOW'
      }
    ]
  })

  await prisma.notification.createMany({
    data: [
      {
        userId: internal.id,
        type: 'CHECKIN_FAILED',
        title: '核销失败提醒',
        content: '订单 ORD20240801003 核销失败：票券状态异常',
        relatedType: 'CHECKIN',
        relatedId: 3,
        isRead: false
      },
      {
        userId: internal.id,
        type: 'REFUND_REQUEST',
        title: '新的退款申请',
        content: '收到新的退款申请，请及时处理',
        relatedType: 'REFUND',
        relatedId: 1,
        isRead: false
      },
      {
        userId: internal.id,
        type: 'SYSTEM',
        title: '系统通知',
        content: '欢迎使用音乐演出活动复盘看板',
        isRead: true
      }
    ]
  })

  await prisma.savedFilter.createMany({
    data: [
      {
        userId: internal.id,
        pageKey: 'orders',
        name: '今日新订单',
        filterData: { status: 'PAID', dateRange: 'today' },
        isDefault: true
      },
      {
        userId: internal.id,
        pageKey: 'orders',
        name: '待处理订单',
        filterData: { status: 'PENDING' },
        isDefault: false
      },
      {
        userId: internal.id,
        pageKey: 'checkins',
        name: '核销失败记录',
        filterData: { status: 'FAILED' },
        isDefault: false
      }
    ]
  })

  console.log('种子数据生成完成！')
  console.log('测试账号：')
  console.log('  管理员: admin / 123456')
  console.log('  内部运营: internal / 123456')
  console.log('  主办方: organizer / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
