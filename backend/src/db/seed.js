import sequelize from './index.js'
import {
  User,
  Driver,
  Tour,
  TourSchedule,
  Order,
  OrderItem,
  CleaningTask,
  ReminderRule,
  Reminder,
  InventoryLog,
  TourVersion
} from './models.js'

const seed = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connected')

    await sequelize.sync({ force: true })
    console.log('Database synchronized')

    const users = await User.bulkCreate([
      {
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin',
        phone: '13800138000',
        email: 'admin@example.com',
        status: 'active'
      },
      {
        username: 'operator1',
        password: 'operator123',
        name: '运营专员张三',
        role: 'operator',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        status: 'active'
      },
      {
        username: 'operator2',
        password: 'operator123',
        name: '运营专员李四',
        role: 'operator',
        phone: '13800138002',
        email: 'lisi@example.com',
        status: 'active'
      },
      {
        username: 'viewer1',
        password: 'viewer123',
        name: '查看员王五',
        role: 'viewer',
        phone: '13800138003',
        email: 'wangwu@example.com',
        status: 'active'
      }
    ], { individualHooks: true })
    console.log('Users created')

    const drivers = await Driver.bulkCreate([
      {
        name: '张师傅',
        phone: '13900139001',
        licenseNumber: 'A12345678',
        vehiclePlate: '京A12345',
        status: 'on_duty',
        delayCount: 0
      },
      {
        name: '李师傅',
        phone: '13900139002',
        licenseNumber: 'A23456789',
        vehiclePlate: '京B23456',
        status: 'on_duty',
        delayCount: 2
      },
      {
        name: '王师傅',
        phone: '13900139003',
        licenseNumber: 'A34567890',
        vehiclePlate: '京C34567',
        status: 'off_duty',
        delayCount: 1
      },
      {
        name: '赵师傅',
        phone: '13900139004',
        licenseNumber: 'A45678901',
        vehiclePlate: '京D45678',
        status: 'rest',
        delayCount: 0
      }
    ])
    console.log('Drivers created')

    const tours = await Tour.bulkCreate([
      {
        name: '故宫深度游',
        code: 'TOUR001',
        destination: '北京',
        duration: 240,
        price: 299.00,
        capacity: 30,
        description: '专业导游带领，深度了解故宫历史文化',
        highlights: ['专业导游', '免排队', '珍宝馆', '钟表馆'],
        meetingPoint: '故宫午门广场',
        status: 'published',
        operatorId: users[1].id
      },
      {
        name: '长城一日游',
        code: 'TOUR002',
        destination: '北京',
        duration: 480,
        price: 399.00,
        capacity: 45,
        description: '八达岭长城一日游，含往返接送和午餐',
        highlights: ['往返接送', '含午餐', '专业讲解', '缆车可选'],
        meetingPoint: '东直门集合点',
        status: 'published',
        operatorId: users[2].id
      },
      {
        name: '颐和园漫步',
        code: 'TOUR003',
        destination: '北京',
        duration: 180,
        price: 159.00,
        capacity: 25,
        description: '漫步皇家园林，感受历史韵味',
        highlights: ['长廊', '佛香阁', '昆明湖', '十七孔桥'],
        meetingPoint: '颐和园东宫门',
        status: 'published',
        operatorId: users[1].id
      },
      {
        name: '胡同文化游',
        code: 'TOUR004',
        destination: '北京',
        duration: 120,
        price: 129.00,
        capacity: 15,
        description: '穿梭老北京胡同，体验地道京味儿',
        highlights: ['三轮车体验', '四合院参观', '传统小吃'],
        meetingPoint: '南锣鼓巷北口',
        status: 'draft',
        operatorId: users[2].id
      },
      {
        name: '夜景灯光秀',
        code: 'TOUR005',
        destination: '上海',
        duration: 150,
        price: 259.00,
        capacity: 40,
        description: '外滩夜景+陆家嘴灯光秀',
        highlights: ['外滩', '东方明珠', '黄浦江游船'],
        meetingPoint: '外滩陈毅广场',
        status: 'published',
        operatorId: users[1].id
      }
    ])
    console.log('Tours created')

    for (const tour of tours) {
      await TourVersion.create({
        tourId: tour.id,
        version: '1.0',
        content: JSON.stringify(tour.toJSON()),
        changeLog: '初始版本',
        status: 'approved',
        createdBy: tour.operatorId
      })
    }
    console.log('Tour versions created')

    const today = new Date()
    const schedules = []

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      for (const tour of tours.slice(0, 3)) {
        const booked = Math.floor(Math.random() * tour.capacity * 0.7)
        const schedule = await TourSchedule.create({
          tourId: tour.id,
          tourDate: dateStr,
          startTime: '09:00:00',
          endTime: '12:00:00',
          capacity: tour.capacity,
          booked: booked,
          driverId: drivers[Math.floor(Math.random() * 2)].id,
          status: i === 0 ? 'in_progress' : (i < 7 ? 'confirmed' : 'scheduled'),
          remark: ''
        })
        schedules.push(schedule)
      }

      for (const tour of tours.slice(0, 2)) {
        const booked = Math.floor(Math.random() * tour.capacity * 0.5)
        const schedule = await TourSchedule.create({
          tourId: tour.id,
          tourDate: dateStr,
          startTime: '14:00:00',
          endTime: '17:00:00',
          capacity: tour.capacity,
          booked: booked,
          driverId: drivers[Math.floor(Math.random() * 2)].id,
          status: i === 0 ? 'scheduled' : (i < 7 ? 'confirmed' : 'scheduled'),
          remark: ''
        })
        schedules.push(schedule)
      }
    }
    console.log('Schedules created')

    const statuses = ['pending_confirmation', 'confirmed', 'completed', 'refunded']
    const customerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

    for (let i = 0; i < 30; i++) {
      const schedule = schedules[Math.floor(Math.random() * schedules.length)]
      const tour = tours.find(t => t.id === schedule.tourId)
      const quantity = Math.floor(Math.random() * 5) + 1
      const subtotal = tour.price * quantity
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const orderNo = 'TO' + new Date().getFullYear().toString().slice(-2) +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        new Date().getDate().toString().padStart(2, '0') +
        Math.random().toString(36).substring(2, 6).toUpperCase()

      const order = await Order.create({
        orderNo,
        customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
        customerPhone: '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        totalAmount: subtotal,
        paidAmount: status !== 'pending_payment' ? subtotal : 0,
        refundAmount: status === 'refunded' ? subtotal : 0,
        status,
        paymentMethod: status !== 'pending_payment' ? 'wechat' : null,
        paidAt: status !== 'pending_payment' ? new Date() : null,
        confirmedAt: ['confirmed', 'completed', 'refunded'].includes(status) ? new Date() : null,
        confirmedBy: ['confirmed', 'completed', 'refunded'].includes(status) ? users[1].id : null,
        completedAt: status === 'completed' ? new Date() : null,
        refundedAt: status === 'refunded' ? new Date() : null,
        refundedBy: status === 'refunded' ? users[0].id : null,
        refundReason: status === 'refunded' ? '客人临时有事取消' : null,
        source: 'direct'
      })

      await OrderItem.create({
        orderId: order.id,
        tourId: tour.id,
        scheduleId: schedule.id,
        tourName: tour.name,
        tourDate: schedule.tourDate,
        startTime: schedule.startTime,
        quantity,
        unitPrice: tour.price,
        subtotal,
        status: status === 'refunded' ? 'refunded' : (status === 'completed' ? 'used' : 'confirmed'),
        traveles: Array(quantity).fill(null).map((_, idx) => ({
          name: `出行人${idx + 1}`,
          idCard: '110101' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0'),
          phone: '139' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
        }))
      })
    }
    console.log('Orders created')

    const cleaningTypes = ['daily', 'deep', 'emergency']
    const priorities = ['low', 'medium', 'high']

    for (let i = 0; i < 20; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + Math.floor(Math.random() * 7) - 2)
      const dateStr = date.toISOString().split('T')[0]

      const taskNo = 'CT' + new Date().getFullYear().toString().slice(-2) +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        new Date().getDate().toString().padStart(2, '0') +
        Math.random().toString(36).substring(2, 4).toUpperCase()

      const statuses = ['pending', 'in_progress', 'completed']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      await CleaningTask.create({
        taskNo,
        vehiclePlate: drivers[Math.floor(Math.random() * drivers.length)].vehiclePlate,
        cleaningType: cleaningTypes[Math.floor(Math.random() * cleaningTypes.length)],
        scheduledDate: dateStr,
        scheduledTime: '18:00:00',
        location: '停车场A区',
        assigneeId: users[Math.floor(Math.random() * users.length)].id,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        startedAt: status !== 'pending' ? new Date() : null,
        completedAt: status === 'completed' ? new Date() : null,
        remark: '日常清洁维护'
      })
    }
    console.log('Cleaning tasks created')

    const reminderRules = await ReminderRule.bulkCreate([
      {
        name: '司机延误提醒（普通）',
        type: 'driver_delay',
        level: 'normal',
        triggerCondition: { delayMinutes: 5 },
        notificationChannels: ['system'],
        recipientRoles: ['operator'],
        template: '司机延误 {delayMinutes} 分钟，请关注',
        enabled: true,
        createdBy: users[0].id
      },
      {
        name: '司机延误提醒（临期）',
        type: 'driver_delay',
        level: 'imminent',
        triggerCondition: { delayMinutes: 15 },
        notificationChannels: ['system', 'sms'],
        recipientRoles: ['operator', 'admin'],
        template: '司机延误 {delayMinutes} 分钟，已影响行程，请尽快处理',
        enabled: true,
        createdBy: users[0].id
      },
      {
        name: '司机延误提醒（紧急）',
        type: 'driver_delay',
        level: 'urgent',
        triggerCondition: { delayMinutes: 30 },
        notificationChannels: ['system', 'sms', 'email'],
        recipientRoles: ['admin'],
        template: '紧急告警：司机延误 {delayMinutes} 分钟，严重影响运营，请立即处理',
        enabled: true,
        createdBy: users[0].id
      },
      {
        name: '订单待确认提醒',
        type: 'order_reminder',
        level: 'normal',
        triggerCondition: { pendingHours: 2 },
        notificationChannels: ['system'],
        recipientRoles: ['operator'],
        template: '有新订单待确认',
        enabled: true,
        createdBy: users[0].id
      },
      {
        name: '清洁任务临期提醒',
        type: 'cleaning_reminder',
        level: 'imminent',
        triggerCondition: { beforeMinutes: 60 },
        notificationChannels: ['system'],
        recipientRoles: ['operator'],
        template: '清洁任务即将开始，请提醒工作人员',
        enabled: true,
        createdBy: users[0].id
      },
      {
        name: '库存不足告警',
        type: 'inventory_alert',
        level: 'urgent',
        triggerCondition: { occupancyRate: 0.9 },
        notificationChannels: ['system'],
        recipientRoles: ['operator', 'admin'],
        template: '库存告急：{tourName} 剩余不足 {remaining} 位',
        enabled: true,
        createdBy: users[0].id
      }
    ])
    console.log('Reminder rules created')

    const reminderTypes = ['driver_delay', 'order_reminder', 'cleaning_reminder', 'inventory_alert']
    const reminderLevels = ['normal', 'imminent', 'urgent']

    for (let i = 0; i < 15; i++) {
      const type = reminderTypes[Math.floor(Math.random() * reminderTypes.length)]
      const level = reminderLevels[Math.floor(Math.random() * reminderLevels.length)]

      await Reminder.create({
        ruleId: reminderRules[Math.floor(Math.random() * reminderRules.length)].id,
        type,
        level,
        title: `测试提醒 - ${type}`,
        content: `这是一条${level}级别的测试提醒消息，请及时查看处理。`,
        relatedId: Math.floor(Math.random() * 100) + 1,
        relatedType: type,
        recipientIds: [users[1].id, users[2].id],
        readBy: i % 3 === 0 ? [users[1].id] : [],
        status: i % 3 === 0 ? 'read' : 'unread'
      })
    }
    console.log('Reminders created')

    console.log('\n=== Seed data created successfully ===')
    console.log('Default admin account: admin / admin123')
    console.log('Default operator account: operator1 / operator123')

    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
