import { db } from './index';
import {
  users,
  devices,
  inspectionRecords,
  repairOrders,
  coachSchedules,
  pricingRules,
  waitlist,
  events,
  venueUsageReports,
  operationLogs,
  savedFilters,
} from './schema';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      phone: '13800138000',
      email: 'admin@example.com',
    })
    .returning();

  const [staffUser] = await db
    .insert(users)
    .values({
      username: 'staff',
      password: hashedPassword,
      name: '前台员工',
      role: 'staff',
      phone: '13800138001',
      email: 'staff@example.com',
    })
    .returning();

  const [coachUser] = await db
    .insert(users)
    .values({
      username: 'coach',
      password: hashedPassword,
      name: '张教练',
      role: 'coach_supervisor',
      phone: '13800138002',
      email: 'coach@example.com',
    })
    .returning();

  const [managerUser] = await db
    .insert(users)
    .values({
      username: 'manager',
      password: hashedPassword,
      name: '李负责人',
      role: 'manager',
      phone: '13800138003',
      email: 'manager@example.com',
    })
    .returning();

  const [coach2] = await db
    .insert(users)
    .values({
      username: 'coach2',
      password: hashedPassword,
      name: '王教练',
      role: 'coach_supervisor',
      phone: '13800138004',
      email: 'coach2@example.com',
    })
    .returning();

  console.log('Creating devices...');
  const deviceData = [
    { name: '循环水泵 A', code: 'PUMP-001', category: '水循环系统', location: '设备间一层', status: 'normal' as const, description: '主循环水泵，流量50m³/h' },
    { name: '循环水泵 B', code: 'PUMP-002', category: '水循环系统', location: '设备间一层', status: 'normal' as const, description: '备用循环水泵' },
    { name: '沙缸过滤器 1号', code: 'FILTER-001', category: '水循环系统', location: '设备间一层', status: 'normal' as const, description: '高速沙缸过滤器' },
    { name: '臭氧消毒设备', code: 'OZONE-001', category: '消毒系统', location: '设备间二层', status: 'warning' as const, description: '臭氧发生器，需定期检查' },
    { name: '氯投加泵 A', code: 'CHLOR-001', category: '消毒系统', location: '设备间二层', status: 'normal' as const, description: '计量式氯投加泵' },
    { name: 'pH 自动控制系统', code: 'PH-001', category: '水质监测', location: '控制室', status: 'normal' as const, description: '在线pH监测与自动调节' },
    { name: '恒温加热器 A', code: 'HEATER-001', category: '加热系统', location: '设备间一层', status: 'normal' as const, description: '燃气式恒温加热器' },
    { name: '除湿机 1号', code: 'DEHUMID-001', category: '通风系统', location: '馆内吊顶', status: 'fault' as const, description: '泳池区除湿机，需要维修' },
    { name: '水质检测仪', code: 'TESTER-001', category: '水质监测', location: '值班室', status: 'normal' as const, description: '便携式多参数水质检测仪' },
    { name: '急救板', code: 'SAFE-001', category: '安全设备', location: '泳池边', status: 'normal' as const, description: '标准救生急救板' },
  ];

  const createdDevices = [];
  for (const d of deviceData) {
    const [device] = await db.insert(devices).values(d).returning();
    createdDevices.push(device);
  }

  console.log('Creating inspection records...');
  const today = new Date();
  for (let i = 0; i < 20; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const device = createdDevices[i % createdDevices.length];
    const isNormal = Math.random() > 0.3;

    await db.insert(inspectionRecords).values({
      deviceId: device.id,
      inspectorId: staffUser.id,
      inspectionDate: date,
      status: isNormal ? 'normal' : 'abnormal',
      description: isNormal ? '设备运行正常' : '发现异常，需要进一步检查',
      temperature: (26 + Math.random() * 2).toFixed(1),
      phValue: (7.2 + Math.random() * 0.6).toFixed(2),
      chlorineLevel: (0.3 + Math.random() * 0.5).toFixed(2),
    });
  }

  console.log('Creating repair orders...');
  const repairData = [
    { deviceId: createdDevices[7].id, title: '除湿机故障', description: '除湿机无法正常启动，显示屏无反应', priority: 2, status: 'in_progress' as const },
    { deviceId: createdDevices[3].id, title: '臭氧设备告警', description: '臭氧浓度偏低，需要检查发生器', priority: 1, status: 'assigned' as const },
    { deviceId: createdDevices[0].id, title: '水泵异响', description: '水泵运行时有异常噪音', priority: 1, status: 'pending' as const },
  ];

  const repairOrders_: any[] = [];
  for (const r of repairData) {
    const [order] = await db
      .insert(repairOrders)
      .values({
        ...r,
        reporterId: staffUser.id,
        assigneeId: adminUser.id,
        assignedAt: r.status !== 'pending' ? new Date() : null,
        startedAt: r.status === 'in_progress' ? new Date() : null,
      })
      .returning();
    repairOrders_.push(order);
  }

  console.log('Creating coach schedules...');
  const courses = ['自由泳基础', '蛙泳提高', '儿童游泳班', '私教课', '水中健身'];
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i - 3);
    const coach = i % 2 === 0 ? coachUser : coach2;
    const hour = 8 + (i % 8);

    await db.insert(coachSchedules).values({
      coachId: coach.id,
      date,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      location: '泳池 ' + ((i % 3) + 1) + ' 道',
      courseType: courses[i % courses.length],
      maxStudents: 8 + (i % 5),
      status: date < today ? 'completed' : 'scheduled',
      notes: i % 3 === 0 ? '需提前准备教具' : '',
    });
  }

  console.log('Creating pricing rules...');
  const pricingData = [
    { name: '单次入场票', type: 'ticket', price: '50.00', duration: null, description: '单次入场，不限时' },
    { name: '月卡', type: 'membership', price: '300.00', duration: 30, description: '个人月卡，有效期30天' },
    { name: '季卡', type: 'membership', price: '800.00', duration: 90, description: '个人季卡，有效期90天' },
    { name: '年卡', type: 'membership', price: '2800.00', duration: 365, description: '个人年卡，有效期365天' },
    { name: '私教课 - 初级', type: 'course', price: '200.00', duration: 60, description: '一对一私教课，60分钟' },
    { name: '私教课 - 高级', type: 'course', price: '300.00', duration: 90, description: '一对一高级私教课，90分钟' },
    { name: '儿童班 - 基础', type: 'course', price: '150.00', duration: 45, description: '儿童基础班，45分钟' },
    { name: '团体课', type: 'course', price: '80.00', duration: 60, description: '团体健身课，60分钟' },
  ];

  for (const p of pricingData) {
    await db.insert(pricingRules).values(p as any);
  }

  console.log('Creating waitlist entries...');
  const waitlistData = [
    { customerName: '王小明', phone: '13900139001', courseType: '儿童游泳班', preferredCoach: '张教练', preferredTime: '周六上午', status: 'waiting' as const },
    { customerName: '李小红', phone: '13900139002', courseType: '儿童游泳班', preferredCoach: '王教练', preferredTime: '周日上午', status: 'waiting' as const },
    { customerName: '张三', phone: '13900139003', courseType: '私教课', preferredCoach: '张教练', preferredTime: '工作日晚上', status: 'notified' as const },
    { customerName: '李四', phone: '13900139004', courseType: '私教课', preferredCoach: '', preferredTime: '周末', status: 'waiting' as const },
    { customerName: '王五', phone: '13900139005', courseType: '团体课', preferredCoach: '', preferredTime: '周二周四', status: 'enrolled' as const },
    { customerName: '赵六', phone: '13900139006', courseType: '水中健身', preferredCoach: '', preferredTime: '', status: 'waiting' as const },
  ];

  for (const w of waitlistData) {
    await db.insert(waitlist).values(w);
  }

  console.log('Creating events...');
  const eventData = [
    { name: '春季游泳锦标赛', originalDate: new Date(today.getTime() + 7 * 24 * 3600 * 1000), status: 'scheduled' as const, organizer: '市游泳协会', participants: 120, description: '一年一度的春季游泳比赛' },
    { name: '青少年游泳选拔赛', originalDate: new Date(today.getTime() + 14 * 24 * 3600 * 1000), status: 'scheduled' as const, organizer: '体育局', participants: 80, description: '省运会选拔赛' },
    { name: '水上趣味运动会', originalDate: new Date(today.getTime() + 21 * 24 * 3600 * 1000), status: 'scheduled' as const, organizer: '社区中心', participants: 200, description: '家庭亲子活动' },
    { name: '救生员培训考核', originalDate: new Date(today.getTime() - 2 * 24 * 3600 * 1000), status: 'completed' as const, organizer: '红十字会', participants: 30, description: '初级救生员认证培训' },
    { name: '企业团建活动', originalDate: new Date(today.getTime() + 3 * 24 * 3600 * 1000), status: 'rescheduled' as const, organizer: '某科技公司', participants: 50, description: '原定于上周，因故改期' },
  ];

  for (const e of eventData) {
    await db.insert(events).values({
      name: e.name,
      originalDate: e.originalDate,
      currentDate: e.originalDate,
      startTime: '09:00',
      endTime: '17:00',
      location: '主泳池',
      organizer: e.organizer,
      participants: e.participants,
      status: e.status,
      description: e.description,
      rescheduleReason: e.status === 'rescheduled' ? '因天气原因改期' : null,
    });
  }

  console.log('Creating venue usage reports...');
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const eventCount = isWeekend ? (Math.random() > 0.5 ? 1 : 0) : 0;
    const courseCount = isWeekend ? 6 : 4;
    const usedHours = (isWeekend ? 10 : 6) + Math.random() * 2;
    const totalHours = 12;

    await db.insert(venueUsageReports).values({
      date,
      totalHours: totalHours.toString(),
      usedHours: usedHours.toFixed(2),
      utilizationRate: ((usedHours / totalHours) * 100).toFixed(2),
      eventCount,
      courseCount,
    });
  }

  console.log('Creating operation logs...');
  const logData = [
    { userId: adminUser.id, action: 'user_login', module: 'auth', details: { username: 'admin' } },
    { userId: staffUser.id, action: 'create_inspection', module: 'inspections', details: { device: '循环水泵 A' } },
    { userId: staffUser.id, action: 'create_repair_order', module: 'repairs', details: { title: '除湿机故障' } },
    { userId: adminUser.id, action: 'assign_repair', module: 'repairs', details: { orderId: 1 } },
    { userId: coachUser.id, action: 'user_login', module: 'auth', details: { username: 'coach' } },
  ];

  for (const log of logData) {
    await db.insert(operationLogs).values(log as any);
  }

  console.log('Creating saved filters...');
  const filterData = [
    { userId: adminUser.id, name: '待处理维修', module: 'repairs', filters: { status: 'pending' }, isDefault: false },
    { userId: adminUser.id, name: '全部设备', module: 'devices', filters: {}, isDefault: true },
    { userId: staffUser.id, name: '我的巡检', module: 'inspections', filters: { status: 'normal' }, isDefault: false },
    { userId: coachUser.id, name: '本周排班', module: 'schedules', filters: { coachId: coachUser.id }, isDefault: true },
  ];

  for (const f of filterData) {
    await db.insert(savedFilters).values(f as any);
  }

  console.log('Seed completed!');
  console.log('Default accounts:');
  console.log('  admin / 123456 - 管理员');
  console.log('  staff / 123456 - 前台员工');
  console.log('  coach / 123456 - 教练主管');
  console.log('  manager / 123456 - 负责人');

  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
