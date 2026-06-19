import { db } from './index';
import {
  users,
  technicians,
  cityManagers,
  orders,
  orderPhotos,
  reviews,
  refunds,
  rescheduleLogs,
  technicianLoads,
} from './schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function seed() {
  console.log('🌱 开始播种数据...');

  await db.delete(technicianLoads);
  await db.delete(rescheduleLogs);
  await db.delete(refunds);
  await db.delete(reviews);
  await db.delete(orderPhotos);
  await db.delete(orders);
  await db.delete(cityManagers);
  await db.delete(technicians);
  await db.delete(users);

  console.log('🧹 清空旧数据完成');

  const seededUsers = await db
    .insert(users)
    .values([
      { name: '张伟', phone: '13800000001', address: '朝阳区建国路88号', city: '北京' },
      { name: '李娜', phone: '13800000002', address: '海淀区中关村大街1号', city: '北京' },
      { name: '王强', phone: '13800000003', address: '浦东新区陆家嘴环路100号', city: '上海' },
      { name: '刘芳', phone: '13800000004', address: '徐汇区漕溪北路50号', city: '上海' },
      { name: '陈明', phone: '13800000005', address: '天河区珠江新城', city: '广州' },
      { name: '赵丽', phone: '13800000006', address: '南山区科技园', city: '深圳' },
      { name: '孙磊', phone: '13800000007', address: '西湖区文三路', city: '杭州' },
      { name: '周婷', phone: '13800000008', address: '武侯区天府大道', city: '成都' },
    ])
    .returning();

  console.log(`👤 插入 ${seededUsers.length} 个用户`);

  const seededTechnicians = await db
    .insert(technicians)
    .values([
      { name: '李师傅', phone: '13900000001', skillLevel: 3, city: '北京', dailyCapacity: 5 },
      { name: '王师傅', phone: '13900000002', skillLevel: 2, city: '北京', dailyCapacity: 4 },
      { name: '张师傅', phone: '13900000003', skillLevel: 3, city: '上海', dailyCapacity: 5 },
      { name: '陈师傅', phone: '13900000004', skillLevel: 2, city: '上海', dailyCapacity: 4 },
      { name: '刘师傅', phone: '13900000005', skillLevel: 1, city: '广州', dailyCapacity: 3 },
      { name: '赵师傅', phone: '13900000006', skillLevel: 2, city: '深圳', dailyCapacity: 4 },
      { name: '孙师傅', phone: '13900000007', skillLevel: 3, city: '杭州', dailyCapacity: 5 },
      { name: '周师傅', phone: '13900000008', skillLevel: 1, city: '成都', dailyCapacity: 3 },
    ])
    .returning();

  console.log(`🔧 插入 ${seededTechnicians.length} 个师傅`);

  const seededCityManagers = await db
    .insert(cityManagers)
    .values([
      { name: '北京-张经理', phone: '13700000001', city: '北京' },
      { name: '上海-李经理', phone: '13700000002', city: '上海' },
      { name: '广州-王经理', phone: '13700000003', city: '广州' },
      { name: '深圳-刘经理', phone: '13700000004', city: '深圳' },
      { name: '杭州-陈经理', phone: '13700000005', city: '杭州' },
      { name: '成都-赵经理', phone: '13700000006', city: '成都' },
    ])
    .returning();

  console.log(`👔 插入 ${seededCityManagers.length} 个城市经理`);

  const applianceTypes = ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '微波炉'];
  const brands = ['海尔', '美的', '格力', '西门子', '博世', '松下', '三星', 'LG'];
  const faults = [
    '不制冷/不制热',
    '无法启动',
    '噪音过大',
    '漏水',
    '显示屏故障',
    '按键失灵',
    '加热效果差',
    '转速慢',
  ];
  const timeSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];
  const sources = ['online', 'phone', 'walk_in', 'referral', 'third_party'] as const;
  const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded'] as const;
  const delayReasons = ['technician_shortage', 'parts_unavailable', 'customer_reschedule', 'weather', 'traffic', 'complex_repair', 'other'] as const;

  const orderValues = [];
  for (let i = 1; i <= 60; i++) {
    const user = seededUsers[Math.floor(Math.random() * seededUsers.length)];
    const tech = seededTechnicians.find((t) => t.city === user.city) || seededTechnicians[0];
    const manager = seededCityManagers.find((m) => m.city === user.city) || seededCityManagers[0];
    const schedDate = randomDate(30);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isOnTime = Math.random() > 0.3 ? true : false;
    const delayReason = !isOnTime ? delayReasons[Math.floor(Math.random() * delayReasons.length)] : null;

    orderValues.push({
      orderNo: `ORD${String(i).padStart(6, '0')}`,
      userId: user.id,
      technicianId: status === 'pending' ? null : tech.id,
      cityManagerId: manager.id,
      applianceType: applianceTypes[Math.floor(Math.random() * applianceTypes.length)],
      applianceBrand: brands[Math.floor(Math.random() * brands.length)],
      faultDescription: faults[Math.floor(Math.random() * faults.length)],
      address: user.address || '',
      city: user.city || '',
      status,
      source: sources[Math.floor(Math.random() * sources.length)],
      scheduledDate: formatDate(schedDate),
      scheduledTimeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
      actualStartTime: ['completed', 'in_progress'].includes(status) ? new Date(schedDate.getTime() + Math.random() * 3600000) : null,
      actualEndTime: status === 'completed' ? new Date(schedDate.getTime() + 7200000 + Math.random() * 7200000) : null,
      estimatedCost: String(Math.floor(Math.random() * 500) + 100),
      actualCost: ['completed', 'refunded'].includes(status) ? String(Math.floor(Math.random() * 600) + 100) : null,
      isOnTime: ['completed', 'in_progress'].includes(status) ? isOnTime : null,
      delayReason,
      delayDescription: delayReason ? '因' + delayReason + '导致延迟' : null,
    });
  }

  const seededOrders = await db.insert(orders).values(orderValues).returning();
  console.log(`📦 插入 ${seededOrders.length} 个订单`);

  const photoValues = [];
  for (const order of seededOrders.slice(0, 40)) {
    const photoCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < photoCount; i++) {
      photoValues.push({
        orderId: order.id,
        photoUrl: `https://picsum.photos/seed/order${order.id}-${i}/400/300`,
        photoType: 'fault',
      });
    }
  }
  await db.insert(orderPhotos).values(photoValues);
  console.log(`📷 插入 ${photoValues.length} 张故障照片`);

  const completedOrders = seededOrders.filter((o) => o.status === 'completed');
  const reviewValues = [];
  for (const order of completedOrders) {
    const rating = Math.floor(Math.random() * 5) + 1;
    const hasComment = Math.random() > 0.3;
    reviewValues.push({
      orderId: order.id,
      userId: order.userId,
      rating,
      comment: hasComment ? ['师傅很专业，修得很快', '服务态度好，价格公道', '效果一般，有点小问题', '维修技术不错，推荐', '等了很久才来，不满意'][Math.floor(Math.random() * 5)] : null,
      status: rating <= 2 ? ('follow_up' as const) : ('pending' as const),
      followUpNote: rating <= 2 ? '已联系客户致歉，安排二次上门' : null,
      followedBy: rating <= 2 ? (seededCityManagers.find((m) => m.city === order.city)?.id || null) : null,
      followedAt: rating <= 2 ? new Date() : null,
    });
  }
  await db.insert(reviews).values(reviewValues);
  console.log(`⭐ 插入 ${reviewValues.length} 条评价`);

  const refundOrders = seededOrders.filter((o) => o.status === 'refunded' || Math.random() < 0.1);
  const refundValues = [];
  for (let i = 0; i < Math.min(refundOrders.length, 12); i++) {
    const order = refundOrders[i];
    const refundStatus = ['pending', 'approved', 'rejected', 'completed'][Math.floor(Math.random() * 4)] as const;
    const manager = seededCityManagers.find((m) => m.city === order.city);
    refundValues.push({
      refundNo: `RF${String(i + 1).padStart(6, '0')}`,
      orderId: order.id,
      userId: order.userId,
      amount: order.actualCost || order.estimatedCost || '200',
      reason: ['维修效果不佳', '师傅态度不好', '价格不合理', '客户取消订单', '重复收费'][Math.floor(Math.random() * 5)],
      status: refundStatus,
      handledBy: ['pending'].includes(refundStatus) ? null : manager?.id || null,
      handledAt: ['pending'].includes(refundStatus) ? null : new Date(),
      handleNote: ['approved', 'completed'].includes(refundStatus) ? '已核实情况，同意退款' : refundStatus === 'rejected' ? '不符合退款条件，已驳回' : null,
    });
  }
  await db.insert(refunds).values(refundValues);
  console.log(`💰 插入 ${refundValues.length} 条退款记录`);

  const rescheduleValues = [];
  for (let i = 0; i < 15; i++) {
    const order = seededOrders[Math.floor(Math.random() * seededOrders.length)];
    const isCancel = Math.random() < 0.25;
    const oldDate = randomDate(20);
    const newDate = new Date(oldDate.getTime() + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1) * 86400000);
    rescheduleValues.push({
      orderId: order.id,
      oldDate: formatDate(oldDate),
      newDate: isCancel ? null : formatDate(newDate),
      oldTimeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
      newTimeSlot: isCancel ? null : timeSlots[Math.floor(Math.random() * timeSlots.length)],
      reason: isCancel ? '客户临时有事取消' : '客户要求改约时间',
      operatorType: Math.random() > 0.5 ? 'customer' : 'staff',
      operatorId: order.userId,
      isCancellation: isCancel,
    });
  }
  await db.insert(rescheduleLogs).values(rescheduleValues);
  console.log(`📅 插入 ${rescheduleValues.length} 条改约/取消记录`);

  const loadValues = [];
  for (const tech of seededTechnicians) {
    for (let d = 0; d < 14; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const assigned = Math.floor(Math.random() * (tech.dailyCapacity + 2));
      const completed = Math.min(assigned, Math.floor(Math.random() * tech.dailyCapacity));
      loadValues.push({
        technicianId: tech.id,
        date: formatDate(date),
        assignedCount: assigned,
        completedCount: completed,
        loadRate: String(Math.min(100, (assigned / tech.dailyCapacity) * 100).toFixed(1)),
        city: tech.city,
      });
    }
  }
  await db.insert(technicianLoads).values(loadValues);
  console.log(`📊 插入 ${loadValues.length} 条师傅负载记录`);

  console.log('✅ 数据播种完成！');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 播种失败:', err);
  process.exit(1);
});
