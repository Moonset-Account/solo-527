import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import bcrypt from 'bcryptjs'

export default class MainSeeder extends BaseSeeder {
  public async run() {
    const trx = await Database.transaction()

    try {
      const today = new Date()
      const formatDate = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const addDays = (d, n) => {
        const nd = new Date(d)
        nd.setDate(nd.getDate() + n)
        return nd
      }
      const pad = (n, w = 2) => String(n).padStart(w, '0')
      const genOrderNo = (idx) => {
        const d = today
        return `TO${d.getFullYear().toString().slice(-2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(idx, 4)}`
      }
      const genTaskNo = (idx) => {
        const d = today
        return `CT${d.getFullYear().toString().slice(-2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(idx, 3)}`
      }
      const hashPassword = async (pw) => bcrypt.hash(pw, 10)

      const [adminPw, op1Pw, op2Pw, vw1Pw] = await Promise.all([
        hashPassword('admin123'),
        hashPassword('operator123'),
        hashPassword('operator123'),
        hashPassword('viewer123'),
      ])

      const userRows = await trx
        .table('users')
        .insert([
          { username: 'admin', password: adminPw, name: '系统管理员', role: 'admin', phone: '13800138000', email: 'admin@example.com', status: 'active', created_at: new Date(), updated_at: new Date() },
          { username: 'operator1', password: op1Pw, name: '运营专员张三', role: 'operator', phone: '13800138001', email: 'zhangsan@example.com', status: 'active', created_at: new Date(), updated_at: new Date() },
          { username: 'operator2', password: op2Pw, name: '运营专员李四', role: 'operator', phone: '13800138002', email: 'lisi@example.com', status: 'active', created_at: new Date(), updated_at: new Date() },
          { username: 'viewer1', password: vw1Pw, name: '查看员王五', role: 'viewer', phone: '13800138003', email: 'wangwu@example.com', status: 'active', created_at: new Date(), updated_at: new Date() },
        ])
        .returning('*')
      const users = userRows
      const adminId = users[0].id
      const op1Id = users[1].id
      const op2Id = users[2].id
      const viewerId = users[3].id
      console.log('[seed] users created:', users.length)

      const driverRows = await trx
        .table('drivers')
        .insert([
          { name: '张师傅', phone: '13900139001', license_no: 'A12345678', status: 'active', delay_count: 0, delay_minutes: 0, remark: '金牌老司机', created_at: new Date(), updated_at: new Date() },
          { name: '李师傅', phone: '13900139002', license_no: 'A23456789', status: 'active', delay_count: 2, delay_minutes: 25, remark: '经验丰富', created_at: new Date(), updated_at: new Date() },
          { name: '王师傅', phone: '13900139003', license_no: 'A34567890', status: 'on_leave', delay_count: 1, delay_minutes: 10, remark: '休假中', created_at: new Date(), updated_at: new Date() },
          { name: '赵师傅', phone: '13900139004', license_no: null, status: 'inactive', delay_count: 0, delay_minutes: 0, remark: '已离职', created_at: new Date(), updated_at: new Date() },
        ])
        .returning('*')
      const drivers = driverRows
      const driver1Id = drivers[0].id
      const driver2Id = drivers[1].id
      console.log('[seed] drivers created:', drivers.length)

      const toursData = [
        { code: 'TOUR-GC-001', name: '八达岭长城一日游', destination: '北京延庆', duration: 480, price: 399.0, capacity: 45, description: '八达岭长城经典一日游，含往返接送、门票、午餐、专业导游讲解。领略万里长城雄伟壮观。', highlights: ['往返空调大巴接送', '含景区门票', '特色农家午餐', '资深导游全程讲解', '赠送好汉坡证书'], meeting_point: '东直门地铁站C口集合', status: 'published' },
        { code: 'TOUR-GG-001', name: '故宫博物院深度游', destination: '北京东城', duration: 240, price: 299.0, capacity: 30, description: '专业导游带领深度游览故宫，解锁六百年皇家秘史，包含珍宝馆、钟表馆参观。', highlights: ['专业持证导游', '免排队快速入园', '珍宝馆+钟表馆', '无线讲解器', '中轴线+西六宫精品路线'], meeting_point: '故宫午门广场国旗杆下', status: 'published' },
        { code: 'TOUR-YHY-001', name: '颐和园皇家园林漫步', destination: '北京海淀', duration: 180, price: 159.0, capacity: 25, description: '漫步世界文化遗产颐和园，游览长廊、佛香阁、昆明湖、十七孔桥，感受皇家园林之美。', highlights: ['专业讲解', '长廊彩画故事', '昆明湖游船', '苏州街风情'], meeting_point: '颐和园东宫门牌楼前', status: 'published' },
        { code: 'TOUR-TT-001', name: '天坛文化探秘', destination: '北京崇文', duration: 150, price: 129.0, capacity: 20, description: '探访明清两代皇帝祭天圣地，参观祈年殿、回音壁、圜丘坛，了解古代祭祀文化。', highlights: ['资深文化导游', '祈年殿建筑奥秘', '回音壁声学原理', '古代祭天礼仪讲解'], meeting_point: '天坛公园南门内', status: 'published' },
        { code: 'TOUR-HT-001', name: '老北京胡同文化游', destination: '北京西城', duration: 120, price: 129.0, capacity: 15, description: '穿梭南锣鼓巷、什刹海胡同，乘坐三轮车游胡同，参观四合院，品尝地道老北京小吃。', highlights: ['人力三轮车体验', '正宗四合院参观', '老北京豆汁焦圈', '胡同历史讲解'], meeting_point: '南锣鼓巷北口牌坊下', status: 'draft' },
      ]

      const tours = []
      for (const t of toursData) {
        const rows = await trx
          .table('tours')
          .insert({ ...t, highlights: JSON.stringify(t.highlights), operator_id: op1Id, created_at: new Date(), updated_at: new Date() })
          .returning('*')
        tours.push(rows[0])
      }
      console.log('[seed] tours created:', tours.length)

      const tourVersionsData = [
        { version: 'v1.0', title: '初版上线', changeLog: '初始版本，完成基础内容编辑', status: 'approved' },
        { version: 'v1.1', title: '内容优化', changeLog: '优化描述文案，补充亮点信息', status: 'approved' },
        { version: 'v1.2', title: '价格调整', changeLog: '根据市场反馈调整价格和接待人数', status: 'pending' },
      ]
      const tourVersionCount = []
      for (const tour of tours) {
        for (let idx = 0; idx < tourVersionsData.length; idx++) {
          const v = tourVersionsData[idx]
          await trx.table('tour_versions').insert({
            tour_id: tour.id,
            version: v.version,
            title: `${tour.name} - ${v.title}`,
            content: JSON.stringify({ tour: tour.id, name: tour.name, version: v.version }),
            change_log: v.changeLog,
            status: v.status,
            approved_by: v.status === 'approved' ? adminId : null,
            approved_at: v.status === 'approved' ? addDays(today, -5 + idx) : null,
            created_by: op1Id,
            created_at: addDays(today, -10 + idx),
            updated_at: addDays(today, -10 + idx),
          })
          tourVersionCount.push(1)
        }
      }
      console.log('[seed] tour_versions created:', tourVersionCount.length)

      const capacityOpts = [20, 25, 30, 35, 40, 45, 50]
      const schedulesInput = []
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        for (let day = 0; day < 5; day++) {
          const capacity = capacityOpts[(i + day) % capacityOpts.length]
          schedulesInput.push({
            tourIndex: i,
            day,
            tourDate: formatDate(addDays(today, day)),
            capacity,
            initialStatus: day === 0 ? 'in_progress' : day < 2 ? 'confirmed' : 'scheduled',
            driverId: (day + i) % 2 === 0 ? driver1Id : driver2Id,
            vehiclePlate: (day + i) % 2 === 0 ? '京A·12345' : '京B·67890',
          })
        }
      }

      const orderStatusDist = [
        { status: 'pending_confirmation', count: 11 },
        { status: 'confirmed', count: 5 },
        { status: 'completed', count: 6 },
        { status: 'cancelled', count: 5 },
        { status: 'refunded', count: 3 },
      ]
      const customerNames = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周杰', '吴敏', '徐强', '孙婷', '马超', '朱琳', '胡军']
      const paymentMethods = ['cash', 'alipay', 'wechat', 'bank_transfer', 'other']
      const sources = ['online', 'offline', 'partner']

      const orderPlan = []
      const scheduleDelta = new Array(schedulesInput.length).fill(0)
      let orderCounter = 1
      for (const { status, count } of orderStatusDist) {
        for (let i = 0; i < count; i++) {
          const schedIdx = (orderCounter - 1) % schedulesInput.length
          const quantity = 1 + ((orderCounter * 3) % 5)
          const affectsInventory = status === 'pending_confirmation' || status === 'confirmed' || status === 'completed'
          const sign = affectsInventory ? 1 : 0
          scheduleDelta[schedIdx] += sign * quantity
          orderPlan.push({
            schedIdx,
            quantity,
            status,
            affectsInventory,
            orderIdx: orderCounter,
          })
          orderCounter++
        }
      }

      const schedules = []
      for (let si = 0; si < schedulesInput.length; si++) {
        const s = schedulesInput[si]
        const tour = tours[s.tourIndex]
        const capacity = s.capacity
        const baseBooked = Math.min(capacity, scheduleDelta[si] + 2 + ((s.tourIndex * 3 + s.day) % 5))
        const booked = Math.max(scheduleDelta[si], baseBooked)
        const rows = await trx
          .table('tour_schedules')
          .insert({
            tour_id: tour.id,
            tour_date: s.tourDate,
            start_time: '09:00:00',
            end_time: '12:00:00',
            capacity,
            booked,
            status: s.initialStatus,
            driver_id: s.driverId,
            vehicle_plate: s.vehiclePlate,
            remark: `${tour.name} 常规排期`,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('*')
        schedules.push({ ...rows[0], tour_price: tour.price, tour_name: tour.name, start_time: '09:00:00' })
      }
      console.log('[seed] tour_schedules created:', schedules.length)

      const orders = []
      const invLogsToInsert = []
      const runningSchedQty = {}
      for (const s of schedules) runningSchedQty[s.id] = 0

      for (const op of orderPlan) {
        const schedule = schedules[op.schedIdx]
        const customerName = customerNames[(op.orderIdx - 1) % customerNames.length]
        const customerPhone = '138' + String(10000000 + (op.orderIdx * 7654321) % 89999999).padStart(8, '0')
        const source = sources[(op.orderIdx - 1) % sources.length]
        const orderNo = genOrderNo(op.orderIdx)
        const unitPrice = schedule.tour_price
        const subtotal = Number((unitPrice * op.quantity).toFixed(2))
        const baseTime = addDays(today, -(op.orderIdx % 3))

        const paymentMethod = op.status === 'pending_confirmation' ? null : paymentMethods[(op.orderIdx + 1) % paymentMethods.length]
        const paidAmount = op.status === 'pending_confirmation' ? 0 : subtotal
        const refundAmount = op.status === 'refunded' ? subtotal : 0

        const orderRows = await trx
          .table('orders')
          .insert({
            order_no: orderNo,
            customer_name: customerName,
            customer_phone: customerPhone,
            total_amount: subtotal,
            paid_amount: paidAmount,
            refund_amount: refundAmount,
            status: op.status,
            payment_method: paymentMethod,
            paid_at: op.status !== 'pending_confirmation' ? baseTime : null,
            confirmed_at: ['confirmed', 'completed', 'refunded', 'cancelled'].includes(op.status) ? baseTime : null,
            confirmed_by: ['confirmed', 'completed', 'refunded', 'cancelled'].includes(op.status) ? op1Id : null,
            completed_at: op.status === 'completed' ? addDays(baseTime, 1) : null,
            cancelled_at: op.status === 'cancelled' ? addDays(baseTime, 1) : null,
            cancelled_by: op.status === 'cancelled' ? op2Id : null,
            cancel_reason: op.status === 'cancelled' ? '客户行程变更，取消订单' : null,
            refund_reason: op.status === 'refunded' ? '客户身体原因，申请全额退款' : null,
            refunded_at: op.status === 'refunded' ? addDays(baseTime, 2) : null,
            refunded_by: op.status === 'refunded' ? adminId : null,
            remark: `第 ${op.orderIdx} 号测试订单`,
            source,
            created_at: baseTime,
            updated_at: baseTime,
          })
          .returning('*')
        const order = orderRows[0]
        orders.push(order)

        const travelers = []
        for (let t = 0; t < op.quantity; t++) {
          travelers.push({
            name: `${customerName}${t === 0 ? '(本人)' : `同行${t}`}`,
            id_card: '110101' + String(19900101 + ((op.orderIdx + t) * 13) % 10000) + String(1000 + (op.orderIdx * 7 + t * 3) % 8999),
            phone: customerPhone,
          })
        }

        const itemStatus = op.status === 'refunded' ? 'refunded' : op.status === 'cancelled' ? 'cancelled' : 'active'
        const itemRows = await trx
          .table('order_items')
          .insert({
            order_id: order.id,
            tour_id: schedule.tour_id,
            schedule_id: schedule.id,
            tour_name: schedule.tour_name,
            tour_date: schedule.tour_date,
            start_time: schedule.start_time,
            quantity: op.quantity,
            unit_price: unitPrice,
            subtotal,
            status: itemStatus,
            travelers: JSON.stringify(travelers),
            created_at: baseTime,
            updated_at: baseTime,
          })
          .returning('*')
        const orderItem = itemRows[0]

        if (op.affectsInventory) {
          const before = runningSchedQty[schedule.id]
          const after = before + op.quantity
          runningSchedQty[schedule.id] = after
          invLogsToInsert.push({
            schedule_id: schedule.id,
            change_type: 'order',
            change_quantity: op.quantity,
            before_quantity: before,
            after_quantity: after,
            order_id: order.id,
            order_item_id: orderItem.id,
            operator_id: op1Id,
            remark: '订单创建，占用库存',
            change_reason: `订单 ${orderNo} 预订 ${op.quantity} 人`,
            created_at: baseTime,
            updated_at: baseTime,
          })
        }

        if (op.status === 'cancelled') {
          const before = runningSchedQty[schedule.id]
          const after = Math.max(0, before - op.quantity)
          runningSchedQty[schedule.id] = after
          invLogsToInsert.push({
            schedule_id: schedule.id,
            change_type: 'cancel',
            change_quantity: -op.quantity,
            before_quantity: before,
            after_quantity: after,
            order_id: order.id,
            order_item_id: orderItem.id,
            operator_id: op2Id,
            remark: '订单取消，释放库存',
            change_reason: '客户行程变更取消',
            created_at: addDays(baseTime, 1),
            updated_at: addDays(baseTime, 1),
          })
        }

        if (op.status === 'refunded') {
          const before = runningSchedQty[schedule.id]
          const after = Math.max(0, before - op.quantity)
          runningSchedQty[schedule.id] = after
          invLogsToInsert.push({
            schedule_id: schedule.id,
            change_type: 'refund',
            change_quantity: -op.quantity,
            before_quantity: before,
            after_quantity: after,
            order_id: order.id,
            order_item_id: orderItem.id,
            operator_id: adminId,
            remark: '订单退款，释放库存',
            change_reason: '客户身体原因退款',
            created_at: addDays(baseTime, 2),
            updated_at: addDays(baseTime, 2),
          })
        }
      }
      console.log('[seed] orders & order_items created:', orders.length)

      for (const sched of schedules) {
        const currentNet = runningSchedQty[sched.id]
        const diff = sched.booked - currentNet
        if (diff !== 0) {
          const before = runningSchedQty[sched.id]
          const after = before + diff
          runningSchedQty[sched.id] = after
          invLogsToInsert.push({
            schedule_id: sched.id,
            change_type: diff > 0 ? 'manual' : 'system',
            change_quantity: diff,
            before_quantity: Math.max(0, before),
            after_quantity: Math.max(0, after),
            order_id: null,
            order_item_id: null,
            operator_id: adminId,
            remark: '系统初始化库存校准',
            change_reason: diff > 0 ? '补录线下订单占用库存' : '调整超额占用库存',
            created_at: new Date(),
            updated_at: new Date(),
          })
        }
      }

      if (invLogsToInsert.length > 0) {
        await trx.table('inventory_logs').multiInsert(invLogsToInsert)
      }
      const invLogCount = invLogsToInsert.length
      console.log('[seed] inventory_logs created:', invLogCount)

      for (const sched of schedules) {
        const qtyRow = await trx
          .from('inventory_logs')
          .where('schedule_id', sched.id)
          .sum('change_quantity as total')
          .first()
        const actualNet = Number(qtyRow && qtyRow.total ? qtyRow.total : 0)
        if (actualNet !== sched.booked) {
          await trx.table('tour_schedules').where('id', sched.id).update({ booked: actualNet })
          sched.booked = actualNet
        }
      }
      console.log('[seed] inventory vs booked consistency verified and enforced')

      const cleaningStatusDist = { pending: 8, in_progress: 5, completed: 7 }
      const cleaningTypes = ['daily', 'deep', 'emergency']
      const priorities = ['low', 'medium', 'high']
      const cleaningTitles = [
        '车辆日常清洁消毒',
        '车辆内饰深度清洁',
        '紧急清洁任务',
        '车身外观清洗',
        '车内异味处理',
        '座椅地毯深度清洗',
        '空调系统清洁消毒',
        '玻璃清洁保养',
        '轮毂轮胎清洁',
        '后备箱清洁整理',
      ]
      const locations = ['停车场A区', '停车场B区', '清洗中心', '车库', '临时停车点']

      let ctIdx = 1
      for (const [st, count] of Object.entries(cleaningStatusDist)) {
        for (let i = 0; i < count; i++) {
          const offsetDays = ((ctIdx * 3) % 7) - 2
          const scheduledDate = formatDate(addDays(today, offsetDays))
          const scheduledTime = ['08:00:00', '12:00:00', '18:00:00'][ctIdx % 3]
          const cleaningType = cleaningTypes[ctIdx % cleaningTypes.length]
          const priority = priorities[(ctIdx + 1) % priorities.length]
          const title = cleaningTitles[ctIdx % cleaningTitles.length] + ` #${ctIdx}`
          const assigneeId = [op1Id, op2Id, viewerId][ctIdx % 3]
          const startedAt = st !== 'pending' ? addDays(today, offsetDays) : null
          let completedAt = null
          if (st === 'completed' && startedAt) {
            completedAt = new Date(startedAt.getTime() + 2 * 60 * 60 * 1000)
          }
          await trx.table('cleaning_tasks').insert({
            task_no: genTaskNo(ctIdx),
            title,
            description: `${title}，确保车辆干净整洁，符合运营标准。`,
            cleaning_type: cleaningType,
            status: st,
            priority,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            location: locations[ctIdx % locations.length],
            assignee_id: assigneeId,
            started_at: startedAt,
            completed_at: completedAt,
            remark: st === 'completed' ? '已完成清洁，验收合格' : null,
            created_at: new Date(),
            updated_at: new Date(),
          })
          ctIdx++
        }
      }
      console.log('[seed] cleaning_tasks created:', ctIdx - 1)

      const reminderRulesData = [
        { name: '司机延误提醒-普通', type: 'driver_delay', level: 'normal', triggerCondition: { delayMinutes: 5 }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '司机延误提醒', templateContent: '司机 {driverName} 延误 {delayMinutes} 分钟，请保持关注。' },
        { name: '司机延误提醒-临期', type: 'driver_delay', level: 'imminent', triggerCondition: { delayMinutes: 15 }, notificationChannels: ['app', 'sms'], recipientRoles: ['operator', 'admin'], templateTitle: '司机延误临期告警', templateContent: '司机 {driverName} 已延误 {delayMinutes} 分钟，可能影响行程，请尽快处理。' },
        { name: '司机延误提醒-紧急', type: 'driver_delay', level: 'urgent', triggerCondition: { delayMinutes: 30 }, notificationChannels: ['app', 'sms', 'email'], recipientRoles: ['admin'], templateTitle: '【紧急】司机严重延误', templateContent: '紧急告警：司机 {driverName} 延误超过 {delayMinutes} 分钟，严重影响运营，请立即处理！' },
        { name: '订单状态变更紧急通知', type: 'order_status', level: 'urgent', triggerCondition: { statuses: ['cancelled', 'refund_pending'] }, notificationChannels: ['app', 'sms'], recipientRoles: ['operator', 'admin'], templateTitle: '订单紧急状态变更', templateContent: '订单 {orderNo} 状态变更为 {status}，请立即跟进处理。' },
        { name: '库存预警提醒', type: 'inventory_warning', level: 'imminent', triggerCondition: { occupancyRate: 0.85 }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '库存临期预警', templateContent: '路线 {tourName} 在 {tourDate} 排期库存占用率超过 85%，剩余 {remaining} 位。' },
        { name: '清洁任务临期提醒', type: 'cleaning_task', level: 'normal', triggerCondition: { beforeMinutes: 60 }, notificationChannels: ['app'], recipientRoles: ['operator'], templateTitle: '清洁任务即将开始', templateContent: '清洁任务 {taskNo} 将在 60 分钟内开始，请提醒负责人员就位。' },
      ]
      const reminderRuleIds = []
      for (const r of reminderRulesData) {
        const rows = await trx
          .table('reminder_rules')
          .insert({
            name: r.name,
            type: r.type,
            level: r.level,
            trigger_condition: JSON.stringify(r.triggerCondition),
            notification_channels: JSON.stringify(r.notificationChannels),
            recipient_roles: JSON.stringify(r.recipientRoles),
            template_title: r.templateTitle,
            template_content: r.templateContent,
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('id')
        reminderRuleIds.push(rows[0].id)
      }
      console.log('[seed] reminder_rules created:', reminderRuleIds.length)

      const reminderLevelDist = [
        { level: 'normal', count: 6 },
        { level: 'imminent', count: 5 },
        { level: 'urgent', count: 4 },
      ]
      const reminderTypes = ['driver_delay', 'order_status', 'inventory_warning', 'cleaning_task', 'custom']
      const reminderTitlesByLevel = {
        normal: ['系统通知：日常运营数据已更新', '司机出勤提醒', '清洁任务待分配', '订单待跟进', '库存日报已生成', '用户反馈待处理'],
        imminent: ['司机即将超时', '库存即将售罄', '订单临近出发未确认', '清洁任务即将到期', '财务对账提醒'],
        urgent: ['【紧急】司机严重延误', '【紧急】客户投诉需立即处理', '【紧急】订单异常取消', '【紧急】系统告警'],
      }

      let rmIdx = 1
      for (const { level, count } of reminderLevelDist) {
        for (let i = 0; i < count; i++) {
          const type = reminderTypes[(rmIdx + i) % reminderTypes.length]
          const ruleIdx = rmIdx % reminderRuleIds.length
          const title = reminderTitlesByLevel[level][i % reminderTitlesByLevel[level].length]
          const isRead = rmIdx % 4 === 0
          const contentMap = {
            driver_delay: `司机张师傅已延误 ${5 + rmIdx * 3} 分钟，涉及 ${1 + (rmIdx % 3)} 个排期。`,
            order_status: `订单 TO250621${String(1000 + rmIdx).padStart(4, '0')} 状态异常，请立即核实。`,
            inventory_warning: `八达岭长城路线 6月${20 + (rmIdx % 10)}日 排期剩余不足 ${5 + (rmIdx % 5)} 位。`,
            cleaning_task: `清洁任务 CT250621${String(rmIdx).padStart(3, '0')} 即将开始，请通知保洁人员。`,
            custom: `系统提醒：${title}，请相关同事尽快处理。`,
          }
          const tiggeredDays = -(rmIdx % 4)
          await trx.table('reminders').insert({
            rule_id: reminderRuleIds[ruleIdx],
            type,
            level,
            title,
            content: contentMap[type],
            related_id: 100 + rmIdx,
            related_type: type,
            recipient_ids: JSON.stringify([op1Id, op2Id]),
            read_by: isRead ? JSON.stringify([op1Id]) : JSON.stringify([]),
            status: isRead ? 'read' : 'unread',
            triggered_at: addDays(today, tiggeredDays),
            created_at: addDays(today, tiggeredDays),
            updated_at: addDays(today, tiggeredDays),
          })
          rmIdx++
        }
      }
      console.log('[seed] reminders created:', rmIdx - 1)

      await trx.commit()
      console.log('\n[seed] ====== 全部种子数据创建成功 ======')
      console.log('[seed] 默认账号:')
      console.log('[seed]   admin    / admin123    (管理员)')
      console.log('[seed]   operator1/ operator123 (运营)')
      console.log('[seed]   operator2/ operator123 (运营)')
      console.log('[seed]   viewer1  / viewer123   (只读)')
      console.log('[seed] 数据量概览:')
      console.log(`[seed]   用户: ${users.length} | 司机: ${drivers.length} | 路线: ${tours.length}`)
      console.log(`[seed]   路线版本: ${tourVersionCount.length} | 排期: ${schedules.length}`)
      console.log(`[seed]   订单: ${orders.length} | 清洁任务: ${ctIdx - 1}`)
      console.log(`[seed]   提醒规则: ${reminderRuleIds.length} | 提醒消息: ${rmIdx - 1}`)
      console.log(`[seed]   库存日志: ${invLogCount} (已验证与排期 booked 完全一致)`)
    } catch (err) {
      await trx.rollback()
      console.error('[seed] 种子数据创建失败，已回滚:', err)
      throw err
    }
  }
}
