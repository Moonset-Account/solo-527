import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const store = await prisma.store.upsert({
    where: { id: 'store-001' },
    update: {},
    create: {
      id: 'store-001',
      name: '闪亮洗车中心',
      address: '北京市朝阳区建国路88号',
      phone: '010-88888888',
    },
  })

  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'user-001' },
      update: {},
      create: { id: 'user-001', name: '张店长', role: 'MANAGER', phone: '13800000001', storeId: store.id },
    }),
    prisma.user.upsert({
      where: { id: 'user-002' },
      update: {},
      create: { id: 'user-002', name: '李运营', role: 'OPERATOR', phone: '13800000002', storeId: store.id },
    }),
    prisma.user.upsert({
      where: { id: 'user-003' },
      update: {},
      create: { id: 'user-003', name: '王技师', role: 'MANAGER', phone: '13800000003', storeId: store.id },
    }),
  ])

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plateNumber: '京A12345' },
      update: {},
      create: { plateNumber: '京A12345', brand: '宝马', model: '3系', color: '白色', ownerName: '赵先生', ownerPhone: '13900000001' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: '京B67890' },
      update: {},
      create: { plateNumber: '京B67890', brand: '奔驰', model: 'C级', color: '黑色', ownerName: '钱女士', ownerPhone: '13900000002' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: '京C11111' },
      update: {},
      create: { plateNumber: '京C11111', brand: '奥迪', model: 'A4L', color: '银色', ownerName: '孙先生', ownerPhone: '13900000003' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: '京D22222' },
      update: {},
      create: { plateNumber: '京D22222', brand: '特斯拉', model: 'Model 3', color: '红色', ownerName: '周女士', ownerPhone: '13900000004' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: '京E33333' },
      update: {},
      create: { plateNumber: '京E33333', brand: '丰田', model: '凯美瑞', color: '灰色', ownerName: '吴先生', ownerPhone: '13900000005' },
    }),
  ])

  const templates = await Promise.all([
    prisma.inspectionTemplate.upsert({
      where: { id: 'tpl-001' },
      update: {},
      create: {
        id: 'tpl-001',
        name: '标准洗车检测',
        category: '洗车',
        content: { items: ['车身清洁度', '轮胎状态', '玻璃清洁度', '内饰清洁度', '发动机舱清洁'] },
      },
    }),
    prisma.inspectionTemplate.upsert({
      where: { id: 'tpl-002' },
      update: {},
      create: {
        id: 'tpl-002',
        name: '保养检测',
        category: '保养',
        content: { items: ['机油液位', '刹车片厚度', '轮胎磨损', '空调滤芯', '冷却液'] },
      },
    }),
    prisma.inspectionTemplate.upsert({
      where: { id: 'tpl-003' },
      update: {},
      create: {
        id: 'tpl-003',
        name: '试驾前检测',
        category: '试驾',
        content: { items: ['发动机状态', '变速箱响应', '制动系统', '转向系统', '灯光系统'] },
      },
    }),
  ])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const appointments = []
  const serviceTypes = ['WASH', 'MAINTENANCE', 'TEST_DRIVE']
  const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  const customerNames = ['赵先生', '钱女士', '孙先生', '周女士', '吴先生', '郑先生', '冯女士', '陈先生']

  for (let i = 0; i < 15; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(i / 3))
    date.setHours(9 + (i % 8), i % 4 === 0 ? 0 : 30, 0)

    const appointment = await prisma.appointment.create({
      data: {
        customerName: customerNames[i % customerNames.length],
        customerPhone: `1390000${String(i + 1).padStart(4, '0')}`,
        vehicleId: vehicles[i % vehicles.length].id,
        serviceType: serviceTypes[i % serviceTypes.length],
        status: statuses[Math.min(i, statuses.length - 1)],
        scheduledAt: date,
        assigneeId: users[i % users.length].id,
        storeId: store.id,
        notes: i % 3 === 0 ? 'VIP客户，请优先处理' : '',
      },
    })
    appointments.push(appointment)
  }

  for (let i = 0; i < 10; i++) {
    const appointment = appointments[i]
    if (appointment.status === 'COMPLETED' || appointment.status === 'IN_PROGRESS') {
      const method = ['CASH', 'WECHAT', 'ALIPAY', 'CARD'][i % 4]
      const amount = appointment.serviceType === 'WASH' ? 88 : appointment.serviceType === 'MAINTENANCE' ? 388 : 128

      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount,
          method,
          status: i % 3 === 0 ? 'PENDING' : 'PAID',
          paidAt: i % 3 !== 0 ? new Date() : null,
          items: {
            create: [
              { name: appointment.serviceType === 'WASH' ? '标准洗车' : appointment.serviceType === 'MAINTENANCE' ? '常规保养' : '试驾服务', price: amount, quantity: 1 },
            ],
          },
        },
      })
    }
  }

  const taskTitles = [
    '更换刹车片', '空调滤芯更换', '试驾车辆准备', '轮胎更换', '机油更换',
    '客户投诉处理', '车身划痕修复', '预约时间调整', '配件入库', '试驾改期确认',
  ]
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  const taskStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

  for (let i = 0; i < 10; i++) {
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + (i % 5))

    await prisma.task.create({
      data: {
        title: taskTitles[i],
        description: `待办任务描述：${taskTitles[i]}`,
        status: taskStatuses[i % 3],
        priority: priorities[i % 4],
        assigneeId: users[i % users.length].id,
        storeId: store.id,
        vehicleId: i % 2 === 0 ? vehicles[i % vehicles.length].id : undefined,
        appointmentId: i % 3 === 0 ? appointments[i % appointments.length].id : undefined,
        dueDate,
      },
    })
  }

  for (let i = 0; i < 6; i++) {
    const period = new Date(today)
    period.setDate(period.getDate() - i)
    const partNames = ['刹车片', '空调滤芯', '机油滤芯', '空气滤芯', '火花塞', '雨刮器']
    const partCodes = ['BRK-001', 'ACF-001', 'OLF-001', 'ARF-001', 'SPK-001', 'WPR-001']

    await prisma.partsTurnover.create({
      data: {
        partName: partNames[i],
        partCode: partCodes[i],
        stockQuantity: 20 + i * 5,
        usedQuantity: 5 + i * 2,
        turnoverRate: (5 + i * 2) / (20 + i * 5) * 100,
        storeId: store.id,
        period,
      },
    })
  }

  await prisma.conversionAlert.create({
    data: {
      storeId: store.id,
      conversionRate: 45.5,
      threshold: 60.0,
      alertLevel: 'WARNING',
      message: '近7日到店转化率45.5%，低于60%阈值。建议加强预约到店引导，优化服务体验。',
    },
  })

  await prisma.conversionAlert.create({
    data: {
      storeId: store.id,
      conversionRate: 32.0,
      threshold: 60.0,
      alertLevel: 'CRITICAL',
      message: '今日到店转化率仅32%，远低于60%阈值。请立即关注并分析原因。',
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
