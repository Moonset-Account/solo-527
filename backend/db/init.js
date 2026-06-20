import 'dotenv/config'
import sequelize from '../config/database.js'
import models from '../app/Models/index.js'
import bcrypt from 'bcryptjs'

const {
  User, Driver, Tour, TourVersion, TourSchedule,
  Order, OrderItem, CleaningTask, ReminderRule, Reminder, InventoryLog
} = models

const today = new Date()
today.setHours(0, 0, 0, 0)

const dateOnly = (d) => {
  return d.toISOString().split('T')[0]
}

const addDays = (base, n) => {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return dateOnly(d)
}

const seed = async () => {
  try {
    console.log('开始连接数据库...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    console.log('\n开始同步表结构（force=true 会重建所有表）...')
    await sequelize.sync({ force: true })
    console.log('✅ 所有表同步完成')

    console.log('\n========== 开始写入种子数据 ==========')

    // ==================== 1. 用户 ====================
    console.log('\n[1/11] 写入用户...')
    const users = await User.bulkCreate([
      { username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', phone: '13800138000', email: 'admin@example.com', status: 'active' },
      { username: 'operator1', password: 'operator123', name: '运营专员张三', role: 'operator', phone: '13800138001', email: 'zhangsan@example.com', status: 'active' },
      { username: 'operator2', password: 'operator123', name: '运营专员李四', role: 'operator', phone: '13800138002', email: 'lisi@example.com', status: 'active' },
      { username: 'viewer1', password: 'viewer123', name: '查看员王五', role: 'viewer', phone: '13800138003', email: 'wangwu@example.com', status: 'active' }
    ], { individualHooks: true })
    const [admin, op1, op2, viewer1] = users
    console.log(`✅ 已写入 ${users.length} 个用户`)

    // ==================== 2. 司机 ====================
    console.log('\n[2/11] 写入司机...')
    const drivers = await Driver.bulkCreate([
      { name: '王师傅', phone: '13900139001', licenseNo: 'B1-123456', status: 'active', delayCount: 0, delayMinutes: 0 },
      { name: '李师傅', phone: '13900139002', licenseNo: 'A1-234567', status: 'active', delayCount: 2, delayMinutes: 35 },
      { name: '张师傅', phone: '13900139003', licenseNo: 'A2-345678', status: 'on_leave', delayCount: 5, delayMinutes: 130 },
      { name: '赵师傅', phone: '13900139004', licenseNo: 'B1-456789', status: 'active', delayCount: 0, delayMinutes: 0 }
    ])
    console.log(`✅ 已写入 ${drivers.length} 个司机`)

    // ==================== 3. 导览路线 ====================
    console.log('\n[3/11] 写入导览路线...')
    const toursData = [
      { name: '八达岭长城一日游', code: 'TOUR001', destination: '北京延庆', duration: 480, price: 399, capacity: 45, description: '八达岭长城一日游，含往返接送和午餐，专业导游讲解', highlights: ['往返接送', '含午餐', '专业讲解', '缆车可选'], meetingPoint: '东直门集合点', status: 'published', operatorId: op1.id },
      { name: '故宫深度游', code: 'TOUR002', destination: '北京市中心', duration: 300, price: 299, capacity: 30, description: '故宫博物院深度讲解，含珍宝馆钟表馆门票', highlights: ['深度讲解', '含珍宝馆', '含钟表馆', '赠地图'], meetingPoint: '午门集合', status: 'published', operatorId: op1.id },
      { name: '颐和园皇家园林', code: 'TOUR003', destination: '北京海淀', duration: 360, price: 259, capacity: 35, description: '颐和园深度游览，昆明湖游船可选，长廊讲解', highlights: ['长廊讲解', '昆明湖游', '佛香阁', '苏州街'], meetingPoint: '北宫门集合', status: 'published', operatorId: op2.id },
      { name: '天坛祈年殿讲解', code: 'TOUR004', destination: '北京南城', duration: 240, price: 179, capacity: 40, description: '天坛公园讲解，含祈年殿、圜丘、回音壁', highlights: ['祈年殿', '圜丘坛', '回音壁', '专业讲解'], meetingPoint: '南门集合', status: 'published', operatorId: op1.id },
      { name: '北京胡同文化游', code: 'TOUR005', destination: '北京什刹海', duration: 210, price: 199, capacity: 20, description: '南锣鼓巷+什刹海胡同游，三轮车体验，四合院参观', highlights: ['三轮车', '四合院', '品大碗茶', '老北京故事'], meetingPoint: '鼓楼集合', status: 'archived', operatorId: op2.id }
    ]
    const tours = []
    for (const t of toursData) {
      tours.push(await Tour.create(t))
    }
    console.log(`✅ 已写入 ${tours.length} 条路线`)

    // ==================== 4. 行程版本 ====================
    console.log('\n[4/11] 写入行程版本...')
    const versions = []
    for (const tour of tours) {
      versions.push(await TourVersion.create({ tourId: tour.id, version: 'v1.0', title: `${tour.name} 初始版本`, content: tour.description, changeLog: '初次发布', status: 'approved', approvedBy: admin.id, approvedAt: new Date(), createdBy: op1.id }))
      versions.push(await TourVersion.create({ tourId: tour.id, version: 'v1.1', title: `${tour.name} 优化版`, content: `${tour.description}，优化了集合时间和用餐安排`, changeLog: '1. 提前集合30分钟\n2. 增加用餐时长\n3. 新增拍照点', status: 'approved', approvedBy: admin.id, approvedAt: new Date(), createdBy: op2.id }))
      versions.push(await TourVersion.create({ tourId: tour.id, version: 'v1.2', title: `${tour.name} 夏季特惠版`, content: `${tour.description}，夏季特惠含冰饮`, changeLog: '1. 增加免费冰饮\n2. 调整行程避开高温时段（待审核）', status: 'pending', createdBy: op1.id }))
    }
    console.log(`✅ 已写入 ${versions.length} 个行程版本`)

    // ==================== 5. 排期（5天连续） ====================
    console.log('\n[5/11] 写入排期（5天×5路线=25条）...')
    const schedules = []
    const schedData = [
      { startTime: '08:00:00', endTime: '16:00:00', capacity: 45 },
      { startTime: '09:00:00', endTime: '14:00:00', capacity: 30 },
      { startTime: '08:30:00', endTime: '14:30:00', capacity: 35 },
      { startTime: '09:30:00', endTime: '13:30:00', capacity: 40 },
      { startTime: '10:00:00', endTime: '13:30:00', capacity: 20 }
    ]
    for (let day = 0; day < 5; day++) {
      for (let i = 0; i < tours.length; i++) {
        const t = tours[i]
        const s = schedData[i]
        const booked = day < 3 ? Math.floor(Math.random() * (s.capacity - 5)) + 5 : Math.floor(Math.random() * 10) + 1
        const statuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'scheduled']
        schedules.push(await TourSchedule.create({
          tourId: t.id, tourDate: addDays(today, day),
          startTime: s.startTime, endTime: s.endTime,
          capacity: s.capacity, booked: 0, // 先0，后面通过inventoryService逻辑设置
          status: statuses[day % 5],
          driverId: drivers[i % drivers.length].id,
          vehiclePlate: `京A${10000 + day * 10 + i}`,
          remark: day === 0 ? '旺季增加一班' : ''
        }))
      }
    }
    console.log(`✅ 已写入 ${schedules.length} 条排期`)

    // ==================== 6/7. 订单 + 订单项（含库存变动日志） ====================
    console.log('\n[6-7/11] 写入订单、订单项及库存日志（确保库存一致性）...')

    const schedBookedTracker = {} // scheduleId -> 当前已占用数量
    for (const s of schedules) schedBookedTracker[s.id] = 0

    const inventoryLogs = []

    const customerNames = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄敏', '周强', '吴丹', '徐明', '孙丽', '马超', '朱红', '胡军', '郭婷', '何峰', '林雪', '罗勇', '梁玉', '宋涛', '唐洁', '韩冰', '冯磊', '董晶', '萧峰', '程瑶', '曹阳', '彭丽', '田野']
    const orderStatuses = [
      ...Array(11).fill('pending_confirmation'),
      ...Array(5).fill('confirmed'),
      ...Array(6).fill('completed'),
      ...Array(5).fill('cancelled'),
      ...Array(3).fill('refunded')
    ]

    let orderIndex = 0
    const orders = []
    const orderItems = []

    for (let oi = 0; oi < 30; oi++) {
      const customerName = customerNames[oi]
      const status = orderStatuses[oi]
      const sched = schedules[oi % schedules.length]
      const tour = tours.find(t => t.id === sched.tourId)
      const quantity = Math.floor(Math.random() * 4) + 1
      const unitPrice = parseFloat(tour.price)
      const subtotal = unitPrice * quantity
      const orderNo = `TO${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(oi+1).padStart(4,'0')}`

      const shouldReleaseInventory = (status === 'cancelled' || status === 'refunded')
      const shouldDeductInventory = (status === 'confirmed' || status === 'completed' || status === 'pending_confirmation')

      let actualQtyDeducted = 0
      let cancelledQty = 0
      let refundedQty = 0

      // 创建订单
      const order = await Order.create({
        orderNo, customerName,
        customerPhone: `138${String(10000000 + oi).padStart(8,'0')}`,
        totalAmount: subtotal,
        paidAmount: (status !== 'pending_confirmation') ? subtotal : 0,
        refundAmount: (status === 'refunded') ? subtotal : 0,
        status,
        paymentMethod: ['alipay', 'wechat', 'cash', 'bank_transfer'][oi % 4],
        paidAt: (status !== 'pending_confirmation') ? new Date() : null,
        confirmedAt: (status === 'confirmed' || status === 'completed' || status === 'refunded') ? new Date() : null,
        confirmedBy: (status !== 'pending_confirmation') ? admin.id : null,
        completedAt: (status === 'completed') ? new Date() : null,
        cancelledAt: (status === 'cancelled') ? new Date() : null,
        cancelledBy: (status === 'cancelled') ? admin.id : null,
        cancelReason: (status === 'cancelled') ? ['客户有事','时间冲突','天气原因','找到更低价','其他原因'][oi % 5] : null,
        refundReason: (status === 'refunded') ? ['行程不满意','时间冲突','生病','其他'][oi % 4] : null,
        refundedAt: (status === 'refunded') ? new Date() : null,
        refundedBy: (status === 'refunded') ? admin.id : null,
        source: ['online', 'offline', 'partner'][oi % 3],
        remark: ''
      })
      orders.push(order)

      // 创建订单项
      const itemStatus = status === 'refunded' ? 'refunded' : (status === 'cancelled' ? 'cancelled' : 'active')
      const item = await OrderItem.create({
        orderId: order.id, tourId: tour.id, scheduleId: sched.id,
        tourName: tour.name, tourDate: sched.tourDate, startTime: sched.startTime,
        quantity, unitPrice, subtotal, status: itemStatus,
        travelers: Array(quantity).fill(null).map((_, i) => ({
          name: `${customerName}${i > 0 ? '的朋友' + i : ''}`,
          idType: '身份证',
          idNo: `110101199${(oi + i) % 10}0101${String(1000 + oi + i).slice(-4)}`,
          phone: i === 0 ? `138${String(10000000 + oi).padStart(8,'0')}` : ''
        }))
      })
      orderItems.push(item)

      // ====== 关键：写库存变动日志，确保和 booked 一致 ======
      let beforeQty = schedBookedTracker[sched.id]

      if (shouldDeductInventory) {
        // 1. 先写 order 类型日志（扣减）
        const afterQty = beforeQty + quantity
        inventoryLogs.push({
          scheduleId: sched.id, changeType: 'order', changeQuantity: quantity,
          beforeQuantity: beforeQty, afterQuantity: afterQty,
          orderId: order.id, orderItemId: item.id, operatorId: op1.id,
          remark: `创建订单 #${orderNo}`,
          changeReason: '订单扣减库存',
          createdAt: new Date(Date.now() - oi*60000),
          updatedAt: new Date(Date.now() - oi*60000)
        })
        beforeQty = afterQty
        actualQtyDeducted = quantity

        if (shouldReleaseInventory && status === 'cancelled') {
          // 2. 取消，再写 cancel 类型日志（释放）
          const afterQty2 = beforeQty - quantity
          inventoryLogs.push({
            scheduleId: sched.id, changeType: 'cancel', changeQuantity: -quantity,
            beforeQuantity: beforeQty, afterQuantity: afterQty2,
            orderId: order.id, orderItemId: item.id, operatorId: admin.id,
            remark: `取消订单 #${orderNo}`,
            changeReason: '订单取消释放库存',
            createdAt: new Date(Date.now() - oi*60000 + 3000),
            updatedAt: new Date(Date.now() - oi*60000 + 3000)
          })
          beforeQty = afterQty2
          cancelledQty = quantity
        }
        if (shouldReleaseInventory && status === 'refunded') {
          // 3. 退款，写 refund 类型日志（释放）
          const afterQty2 = beforeQty - quantity
          inventoryLogs.push({
            scheduleId: sched.id, changeType: 'refund', changeQuantity: -quantity,
            beforeQuantity: beforeQty, afterQuantity: afterQty2,
            orderId: order.id, orderItemId: item.id, operatorId: admin.id,
            remark: `退款订单 #${orderNo}`,
            changeReason: '订单退款释放库存',
            createdAt: new Date(Date.now() - oi*60000 + 5000),
            updatedAt: new Date(Date.now() - oi*60000 + 5000)
          })
          beforeQty = afterQty2
          refundedQty = quantity
        }
      }

      schedBookedTracker[sched.id] = beforeQty
      orderIndex++
    }

    // 手动调整几个排期，增加一条 manual 日志
    console.log('  追加手工调整库存日志...')
    for (let i = 0; i < 3; i++) {
      const sched = schedules[i * 5]
      const beforeQty = schedBookedTracker[sched.id]
      const manualChange = 1
      const afterQty = beforeQty + manualChange
      inventoryLogs.push({
        scheduleId: sched.id, changeType: 'manual', changeQuantity: manualChange,
        beforeQuantity: beforeQty, afterQuantity: afterQty,
        operatorId: admin.id,
        remark: '现场临时增加一位',
        changeReason: '人工调整',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000)
      })
      schedBookedTracker[sched.id] = afterQty
    }

    // 更新 tour_schedules.booked 为实际值
    console.log('  校准 tour_schedules.booked 字段...')
    for (const sched of schedules) {
      await sched.update({ booked: schedBookedTracker[sched.id] })
    }

    // 批量写入 inventory_logs
    await InventoryLog.bulkCreate(inventoryLogs)
    console.log(`✅ 已写入 ${orders.length} 个订单 / ${orderItems.length} 订单项 / ${inventoryLogs.length} 条库存变动日志`)

    // ==================== 8. 清洁任务 ====================
    console.log('\n[8/11] 写入清洁任务...')
    const cleaningTasksData = [
      { title: '前门站点车辆清洁', description: '前门站点大巴车外部清洗+内部清扫', cleaningType: 'daily', status: 'pending', priority: 'medium', scheduledDate: dateOnly(today), scheduledTime: '07:00:00', location: '前门停车场', assigneeId: op1.id },
      { title: '北站车辆深度清洁', description: '深度清洁，含座椅、空调滤网', cleaningType: 'deep', status: 'in_progress', priority: 'high', scheduledDate: dateOnly(today), scheduledTime: '08:00:00', location: '北站车库', assigneeId: op2.id },
      { title: '应急车辆清洁', description: '游客呕吐应急清洁', cleaningType: 'emergency', status: 'completed', priority: 'high', scheduledDate: dateOnly(today), scheduledTime: '12:30:00', location: '长城停车场', assigneeId: op1.id },
      { title: '东直门日常清洁', description: '东直门站点车辆日常清洁', cleaningType: 'daily', status: 'pending', priority: 'low', scheduledDate: dateOnly(today), scheduledTime: '17:00:00', location: '东直门枢纽站', assigneeId: op1.id },
      { title: '颐和园站点清洁', description: '颐和园终点站车辆清洁', cleaningType: 'daily', status: 'completed', priority: 'medium', scheduledDate: dateOnly(today), scheduledTime: '15:00:00', location: '颐和园北宫门', assigneeId: op2.id },
      { title: '故宫接待点清洁', description: '故宫接待点车辆+休息室清洁', cleaningType: 'daily', status: 'in_progress', priority: 'medium', scheduledDate: dateOnly(today), scheduledTime: '14:00:00', location: '故宫午门', assigneeId: op1.id },
      { title: '什刹海三轮车清洁', description: '胡同游三轮车日常清洁保养', cleaningType: 'daily', status: 'completed', priority: 'low', scheduledDate: dateOnly(today), scheduledTime: '06:30:00', location: '鼓楼胡同游站点', assigneeId: op2.id },
      { title: '天坛站点车辆深度清洁', description: '空调系统深度清洁', cleaningType: 'deep', status: 'pending', priority: 'medium', scheduledDate: addDays(today, 1), scheduledTime: '08:00:00', location: '天坛南门', assigneeId: op2.id },
      { title: '延庆停车场紧急清洁', description: '车窗破裂应急', cleaningType: 'emergency', status: 'pending', priority: 'high', scheduledDate: addDays(today, 1), scheduledTime: '09:00:00', location: '八达岭景区停车场', assigneeId: op1.id },
      { title: '车辆座椅深度清洗', description: '多台车座椅有污渍，需深度清洗', cleaningType: 'deep', status: 'in_progress', priority: 'high', scheduledDate: dateOnly(today), scheduledTime: '19:00:00', location: '总部车库', assigneeId: op1.id },
      { title: '昨日常规清洁任务1', description: '每日清洁', cleaningType: 'daily', status: 'completed', priority: 'medium', scheduledDate: addDays(today, -1), scheduledTime: '07:00:00', location: '前门停车场', assigneeId: op1.id },
      { title: '昨日常规清洁任务2', description: '每日清洁', cleaningType: 'daily', status: 'completed', priority: 'medium', scheduledDate: addDays(today, -1), scheduledTime: '08:00:00', location: '东直门枢纽站', assigneeId: op2.id },
      { title: '昨日超时清洁任务（逾期）', description: '逾期未完成', cleaningType: 'daily', status: 'pending', priority: 'medium', scheduledDate: addDays(today, -1), scheduledTime: '17:00:00', location: '颐和园站点', assigneeId: op2.id },
      { title: '上周深度清洁任务', description: '已完成', cleaningType: 'deep', status: 'completed', priority: 'low', scheduledDate: addDays(today, -3), scheduledTime: '09:00:00', location: '总部车库', assigneeId: op1.id },
      { title: '明天清洁任务', description: '每日清洁', cleaningType: 'daily', status: 'pending', priority: 'medium', scheduledDate: addDays(today, 1), scheduledTime: '07:30:00', location: '北站车库', assigneeId: op2.id },
      { title: '清洁任务-取消', description: '取消的任务', cleaningType: 'daily', status: 'cancelled', priority: 'low', scheduledDate: addDays(today, -1), scheduledTime: '07:00:00', location: '测试地', assigneeId: op1.id },
      { title: '后天清洁任务A', cleaningType: 'daily', status: 'pending', priority: 'low', scheduledDate: addDays(today, 2), scheduledTime: '08:00:00', location: '各站点巡回', assigneeId: op1.id },
      { title: '后天清洁任务B', cleaningType: 'deep', status: 'pending', priority: 'medium', scheduledDate: addDays(today, 2), scheduledTime: '10:00:00', location: '总部车库', assigneeId: op2.id },
      { title: '胡同游三轮车深度保养', cleaningType: 'deep', status: 'pending', priority: 'medium', scheduledDate: addDays(today, 1), scheduledTime: '07:00:00', location: '鼓楼站点', assigneeId: op1.id },
      { title: '游客中心公共区域清洁', description: '每日公共区域清洁', cleaningType: 'daily', status: 'completed', priority: 'medium', scheduledDate: dateOnly(today), scheduledTime: '20:00:00', location: '总部游客中心', assigneeId: op1.id }
    ]

    const cleaningTasks = []
    let taskSeq = 1
    for (const t of cleaningTasksData) {
      const taskNo = `CLN${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(taskSeq++).padStart(5,'0')}`
      const task = await CleaningTask.create({ ...t, taskNo })
      if (t.status === 'in_progress') {
        await task.update({ startedAt: new Date(Date.now() - 1800000) })
      } else if (t.status === 'completed') {
        await task.update({ startedAt: new Date(Date.now() - 5400000), completedAt: new Date(Date.now() - 3600000) })
      }
      cleaningTasks.push(task)
    }
    console.log(`✅ 已写入 ${cleaningTasks.length} 个清洁任务`)

    // ==================== 9. 提醒规则 ====================
    console.log('\n[9/11] 写入提醒规则...')
    const reminderRules = await ReminderRule.bulkCreate([
      { name: '司机轻微延误提醒', type: 'driver_delay', level: 'normal', triggerCondition: { delayMinutesGte: 10 }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '司机延误提醒', templateContent: '司机 {driverName} 出现延误情况，累计延误 {delayMinutes} 分钟，请关注。', enabled: true },
      { name: '司机中等延误临期提醒', type: 'driver_delay', level: 'imminent', triggerCondition: { delayMinutesGte: 30, delayCountGte: 2 }, notificationChannels: ['app', 'email'], recipientRoles: ['operator', 'admin'], templateTitle: '⚠️ 司机延误临期警告', templateContent: '司机 {driverName} 延误已达 {delayMinutes} 分钟/共 {delayCount} 次，请及时处理！', enabled: true },
      { name: '司机严重延误紧急告警', type: 'driver_delay', level: 'urgent', triggerCondition: { delayMinutesGte: 120, delayCountGte: 5 }, notificationChannels: ['app', 'email', 'sms'], recipientRoles: ['admin'], templateTitle: '🚨 司机严重延误紧急告警', templateContent: '司机 {driverName} 严重延误！累计 {delayMinutes} 分钟/共 {delayCount} 次，请立即介入处理！', enabled: true },
      { name: '待确认订单超时告警', type: 'order_status', level: 'urgent', triggerCondition: { status: 'pending_confirmation', hoursSinceCreationGt: 24 }, notificationChannels: ['app', 'email'], recipientRoles: ['operator', 'admin'], templateTitle: '🚨 订单确认超时', templateContent: '订单 #{orderNo} 创建超过24小时仍未确认，请尽快处理。', enabled: true },
      { name: '库存不足临期预警', type: 'inventory_warning', level: 'imminent', triggerCondition: { occupancyRateGte: 85 }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '⚠️ 库存即将售罄', templateContent: '路线 {tourName} {tourDate} 排期上座率已达 {occupancyRate}%，请关注。', enabled: true },
      { name: '清洁任务完成提醒', type: 'cleaning_task', level: 'normal', triggerCondition: { status: 'completed' }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '清洁任务完成', templateContent: '清洁任务 {taskNo} 已完成。', enabled: true }
    ])
    console.log(`✅ 已写入 ${reminderRules.length} 条提醒规则`)

    // ==================== 10. 提醒消息 ====================
    console.log('\n[10/11] 写入提醒消息...')
    const reminderData = [
      // 6 normal
      { ruleId: 1, type: 'driver_delay', level: 'normal', title: '司机延误提醒', content: '司机李师傅出现延误情况，累计延误 35 分钟，请关注。', relatedId: drivers[1].id, relatedType: 'driver', status: 'unread' },
      { ruleId: 6, type: 'cleaning_task', level: 'normal', title: '清洁任务完成', content: '清洁任务 CLN2026062000003 已完成。', relatedId: cleaningTasks[2].id, relatedType: 'cleaning_task', status: 'read' },
      { ruleId: 6, type: 'cleaning_task', level: 'normal', title: '清洁任务完成', content: '清洁任务 CLN2026062000005 已完成。', relatedId: cleaningTasks[4].id, relatedType: 'cleaning_task', status: 'unread' },
      { ruleId: 6, type: 'cleaning_task', level: 'normal', title: '清洁任务完成', content: '清洁任务 CLN2026062000007 已完成。', relatedId: cleaningTasks[6].id, relatedType: 'cleaning_task', status: 'read' },
      { ruleId: 1, type: 'driver_delay', level: 'normal', title: '司机延误提醒', content: '司机张师傅出现延误情况，累计延误 130 分钟，请关注。', relatedId: drivers[2].id, relatedType: 'driver', status: 'unread' },
      { ruleId: 6, type: 'cleaning_task', level: 'normal', title: '清洁任务完成', content: '清洁任务 CLN2026062000020 已完成。', relatedId: cleaningTasks[19].id, relatedType: 'cleaning_task', status: 'unread' },
      // 5 imminent
      { ruleId: 2, type: 'driver_delay', level: 'imminent', title: '⚠️ 司机延误临期警告', content: '司机李师傅延误已达 35 分钟/共 2 次，请及时处理！', relatedId: drivers[1].id, relatedType: 'driver', status: 'unread' },
      { ruleId: 5, type: 'inventory_warning', level: 'imminent', title: '⚠️ 库存即将售罄', content: `路线 ${tours[0].name} ${schedules[0].tourDate} 排期上座率已达 90%，请关注。`, relatedId: schedules[0].id, relatedType: 'schedule', status: 'unread' },
      { ruleId: 5, type: 'inventory_warning', level: 'imminent', title: '⚠️ 库存即将售罄', content: `路线 ${tours[1].name} ${schedules[1].tourDate} 排期上座率已达 88%，请关注。`, relatedId: schedules[1].id, relatedType: 'schedule', status: 'read' },
      { ruleId: 2, type: 'driver_delay', level: 'imminent', title: '⚠️ 司机延误临期警告', content: '司机张师傅延误已达 130 分钟/共 5 次，请及时处理！', relatedId: drivers[2].id, relatedType: 'driver', status: 'unread' },
      { ruleId: 5, type: 'inventory_warning', level: 'imminent', title: '⚠️ 库存即将售罄', content: `路线 ${tours[2].name} ${schedules[2].tourDate} 排期上座率已达 92%，请关注。`, relatedId: schedules[2].id, relatedType: 'schedule', status: 'unread' },
      // 4 urgent
      { ruleId: 3, type: 'driver_delay', level: 'urgent', title: '🚨 司机严重延误紧急告警', content: '司机张师傅严重延误！累计 130 分钟/共 5 次，请立即介入处理！', relatedId: drivers[2].id, relatedType: 'driver', status: 'unread' },
      { ruleId: 4, type: 'order_status', level: 'urgent', title: '🚨 订单确认超时', content: `订单 #${orders[0].orderNo} 创建超过24小时仍未确认，请尽快处理。`, relatedId: orders[0].id, relatedType: 'order', status: 'unread' },
      { ruleId: 4, type: 'order_status', level: 'urgent', title: '🚨 订单确认超时', content: `订单 #${orders[1].orderNo} 创建超过24小时仍未确认，请尽快处理。`, relatedId: orders[1].id, relatedType: 'order', status: 'unread' },
      { ruleId: 3, type: 'driver_delay', level: 'urgent', title: '🚨 司机严重延误紧急告警', content: '需立即安排备用司机和通知游客。', relatedId: drivers[2].id, relatedType: 'driver', status: 'dismissed' },
    ]

    const reminders = await Reminder.bulkCreate(reminderData.map(r => ({
      ...r,
      recipientIds: JSON.stringify([op1.id, op2.id, admin.id]),
      readBy: r.status === 'read' ? JSON.stringify([op1.id]) : JSON.stringify([]),
      triggeredAt: new Date()
    })))
    console.log(`✅ 已写入 ${reminders.length} 条提醒消息`)

    // ==================== 11. 库存一致性最终校验 ====================
    console.log('\n[11/11] 最终库存一致性校验...')
    for (const sched of schedules) {
      const realSum = await InventoryLog.sum('changeQuantity', { where: { scheduleId: sched.id } }) || 0
      if (realSum !== sched.booked) {
        console.log(`  ⚠️ 排期 #${sched.id} 不一致：logs.sum=${realSum} vs booked=${sched.booked} → 正在强制更新`)
        await sched.update({ booked: Math.max(0, realSum) })
      }
    }
    console.log('✅ 库存一致性校验通过')

    console.log('\n========================================')
    console.log('🎉 种子数据全部创建成功！')
    console.log('========================================')
    console.log('默认账号：')
    console.log('  管理员  admin / admin123')
    console.log('  运营1   operator1 / operator123')
    console.log('  运营2   operator2 / operator123')
    console.log('  查看员  viewer1 / viewer123')
    console.log('========================================')

    process.exit(0)
  } catch (e) {
    console.error('\n❌ 种子数据初始化失败：', e)
    console.error(e.stack)
    process.exit(1)
  }
}

seed()
