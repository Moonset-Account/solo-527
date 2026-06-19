/**
 * 数据库初始化脚本
 * 系统启动时自动检查并插入初始数据
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserSchema } from './schemas/user.schema';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { Template, TemplateSchema } from './schemas/template.schema';
import { Part, PartSchema } from './schemas/part.schema';
import { Lead, LeadStatus, LeadIntention, LeadSchema } from './schemas/lead.schema';
import { Rule, RuleSchema } from './schemas/rule.schema';

/**
 * 初始化数据库
 * 在应用启动时调用，确保基础数据存在
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log('[初始化] 开始检查并初始化数据库...');

    const connection = mongoose.connection;

    const UserModel = connection.model<User>(User.name, UserSchema);
    const VehicleModel = connection.model<Vehicle>(Vehicle.name, VehicleSchema);
    const TemplateModel = connection.model<Template>(Template.name, TemplateSchema);
    const PartModel = connection.model<Part>(Part.name, PartSchema);
    const LeadModel = connection.model<Lead>(Lead.name, LeadSchema);
    const RuleModel = connection.model<Rule>(Rule.name, RuleSchema);

    await initUsers(UserModel);
    await initVehicles(VehicleModel);
    await initTemplates(TemplateModel);
    await initParts(PartModel);
    const users = await UserModel.find().exec();
    await initLeads(LeadModel, users);
    await initRules(RuleModel, users);

    console.log('[初始化] 数据库初始化完成！');
  } catch (error) {
    console.error('[初始化] 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 初始化用户数据
 */
async function initUsers(UserModel: mongoose.Model<User>): Promise<void> {
  const count = await UserModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 用户数据已存在，跳过初始化');
    return;
  }

  const saltRounds = 10;
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
  const hashedAdminPassword = await bcrypt.hash(defaultPassword, saltRounds);
  const hashedStaffPassword = await bcrypt.hash('123456', saltRounds);

  const users: Partial<User>[] = [
    {
      username: 'admin',
      password: hashedAdminPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      phone: '13800138000',
    },
    {
      username: 'consultant1',
      password: hashedStaffPassword,
      name: '张顾问',
      role: UserRole.STAFF,
      phone: '13800138001',
    },
    {
      username: 'consultant2',
      password: hashedStaffPassword,
      name: '李顾问',
      role: UserRole.STAFF,
      phone: '13800138002',
    },
  ];

  await UserModel.insertMany(users);
  console.log('[初始化] 插入 3 条用户数据');
}

/**
 * 初始化车辆档案数据
 */
async function initVehicles(VehicleModel: mongoose.Model<Vehicle>): Promise<void> {
  const count = await VehicleModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 车辆数据已存在，跳过初始化');
    return;
  }

  const vehicles: Partial<Vehicle>[] = [
    {
      plateNumber: '京A12345',
      brand: '宝马',
      model: 'X5 xDrive40i',
      vin: 'WBAVM1C50J0V12345',
      ownerName: '王先生',
      ownerPhone: '13900139001',
      mileage: 25000,
      lastMaintenanceDate: new Date('2026-03-15'),
    },
    {
      plateNumber: '京B67890',
      brand: '奔驰',
      model: 'E300L 时尚型',
      vin: 'W1KZF8DBXLA123456',
      ownerName: '李女士',
      ownerPhone: '13900139002',
      mileage: 18000,
      lastMaintenanceDate: new Date('2026-04-20'),
    },
    {
      plateNumber: '沪C11111',
      brand: '奥迪',
      model: 'A6L 45 TFSI',
      vin: 'LFV3A24F8J3123456',
      ownerName: '张先生',
      ownerPhone: '13900139003',
      mileage: 32000,
      lastMaintenanceDate: new Date('2026-02-10'),
    },
    {
      plateNumber: '粤D22222',
      brand: '丰田',
      model: '凯美瑞 2.5G',
      vin: 'LVGBH40K9JG123456',
      ownerName: '刘女士',
      ownerPhone: '13900139004',
      mileage: 15000,
      lastMaintenanceDate: new Date('2026-05-01'),
    },
    {
      plateNumber: '浙E33333',
      brand: '本田',
      model: '雅阁 260TURBO',
      vin: 'LHGCP165XJ8123456',
      ownerName: '陈先生',
      ownerPhone: '13900139005',
      mileage: 28000,
      lastMaintenanceDate: new Date('2026-03-28'),
    },
  ];

  await VehicleModel.insertMany(vehicles);
  console.log('[初始化] 插入 5 条车辆数据');
}

/**
 * 初始化检测模板数据
 */
async function initTemplates(TemplateModel: mongoose.Model<Template>): Promise<void> {
  const count = await TemplateModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 检测模板数据已存在，跳过初始化');
    return;
  }

  const templates: Partial<Template>[] = [
    {
      name: '常规保养检测',
      category: '保养',
      isActive: true,
      items: [
        { name: '发动机机油', standard: '清澈无杂质，液位正常', unit: 'L', minValue: 4.5, maxValue: 5.5 },
        { name: '机油滤清器', standard: '清洁，无堵塞', unit: '', minValue: null, maxValue: null },
        { name: '空气滤清器', standard: '清洁，无破损', unit: '', minValue: null, maxValue: null },
        { name: '空调滤清器', standard: '清洁，无异味', unit: '', minValue: null, maxValue: null },
        { name: '燃油滤清器', standard: '通畅，无堵塞', unit: '', minValue: null, maxValue: null },
        { name: '刹车油', standard: '清澈，含水量<3%', unit: '%', minValue: 0, maxValue: 3 },
        { name: '冷却液', standard: '液位正常，无泄漏', unit: 'L', minValue: 4, maxValue: 6 },
        { name: '变速箱油', standard: '清澈，液位正常', unit: 'L', minValue: 6, maxValue: 8 },
        { name: '转向助力油', standard: '清澈，液位正常', unit: 'L', minValue: 1, maxValue: 2 },
        { name: '刹车片厚度', standard: '>10mm', unit: 'mm', minValue: 10, maxValue: 20 },
        { name: '刹车盘磨损', standard: '无明显凹槽', unit: '', minValue: null, maxValue: null },
        { name: '轮胎花纹深度', standard: '>1.6mm', unit: 'mm', minValue: 1.6, maxValue: 8 },
        { name: '轮胎气压', standard: '2.2-2.5bar', unit: 'bar', minValue: 2.2, maxValue: 2.5 },
        { name: '蓄电池电压', standard: '12.4-14.7V', unit: 'V', minValue: 12.4, maxValue: 14.7 },
        { name: '灯光系统', standard: '全部正常工作', unit: '', minValue: null, maxValue: null },
      ],
    },
    {
      name: '综合安全检测',
      category: '检测',
      isActive: true,
      items: [
        { name: '制动性能', standard: '制动距离<40m(100km/h)', unit: 'm', minValue: 30, maxValue: 40 },
        { name: '转向系统', standard: '转向灵活，无旷量', unit: '', minValue: null, maxValue: null },
        { name: '悬架系统', standard: '无松动，无异响', unit: '', minValue: null, maxValue: null },
        { name: '底盘检查', standard: '无磕碰，无锈蚀', unit: '', minValue: null, maxValue: null },
        { name: '车身外观', standard: '无明显损伤', unit: '', minValue: null, maxValue: null },
        { name: '车内电器', standard: '全部正常工作', unit: '', minValue: null, maxValue: null },
        { name: '安全气囊', standard: '故障灯未亮', unit: '', minValue: null, maxValue: null },
        { name: '安全带', standard: '收放正常', unit: '', minValue: null, maxValue: null },
        { name: '雨刮器', standard: '刮拭干净，无异响', unit: '', minValue: null, maxValue: null },
        { name: '喇叭', standard: '声音洪亮', unit: '', minValue: null, maxValue: null },
        { name: '尾气排放', standard: '符合国家标准', unit: '', minValue: null, maxValue: null },
        { name: '底盘装甲', standard: '完整，无脱落', unit: '', minValue: null, maxValue: null },
      ],
    },
  ];

  await TemplateModel.insertMany(templates);
  console.log('[初始化] 插入 2 条检测模板数据');
}

/**
 * 初始化配件报价数据
 */
async function initParts(PartModel: mongoose.Model<Part>): Promise<void> {
  const count = await PartModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 配件数据已存在，跳过初始化');
    return;
  }

  const parts: Partial<Part>[] = [
    { code: 'OIL-001', name: '全合成机油 0W-40', brand: '美孚', model: '通用', price: 498, stock: 100, unit: '桶' },
    { code: 'OIL-002', name: '全合成机油 5W-30', brand: '嘉实多', model: '通用', price: 398, stock: 150, unit: '桶' },
    { code: 'OIL-003', name: '半合成机油 5W-40', brand: '壳牌', model: '通用', price: 298, stock: 200, unit: '桶' },
    { code: 'FIL-001', name: '机油滤清器', brand: '曼牌', model: '宝马X5', price: 85, stock: 50, unit: '个' },
    { code: 'FIL-002', name: '空气滤清器', brand: '曼牌', model: '宝马X5', price: 120, stock: 40, unit: '个' },
    { code: 'FIL-003', name: '空调滤清器', brand: '曼牌', model: '宝马X5', price: 95, stock: 45, unit: '个' },
    { code: 'FIL-004', name: '燃油滤清器', brand: '曼牌', model: '宝马X5', price: 180, stock: 30, unit: '个' },
    { code: 'BRAKE-001', name: '前刹车片', brand: '布雷博', model: '宝马X5', price: 850, stock: 20, unit: '套' },
    { code: 'BRAKE-002', name: '后刹车片', brand: '布雷博', model: '宝马X5', price: 750, stock: 20, unit: '套' },
    { code: 'BRAKE-003', name: '刹车油 DOT4', brand: '博世', model: '通用', price: 120, stock: 60, unit: 'L' },
    { code: 'TIRE-001', name: '轮胎 245/50R19', brand: '米其林', model: '宝马X5', price: 1680, stock: 16, unit: '条' },
    { code: 'TIRE-002', name: '轮胎 245/45R18', brand: '固特异', model: '奔驰E级', price: 1280, stock: 20, unit: '条' },
    { code: 'BAT-001', name: '蓄电池 12V 80Ah', brand: '瓦尔塔', model: '宝马X5', price: 1280, stock: 10, unit: '个' },
    { code: 'SPARK-001', name: '火花塞', brand: 'NGK', model: '宝马X5', price: 150, stock: 80, unit: '支' },
    { code: 'WIPER-001', name: '雨刮片套装', brand: '博世', model: '宝马X5', price: 180, stock: 30, unit: '套' },
    { code: 'COOLANT-001', name: '防冻液 -45℃', brand: '壳牌', model: '通用', price: 95, stock: 40, unit: '桶' },
  ];

  await PartModel.insertMany(parts);
  console.log('[初始化] 插入 16 条配件数据');
}

/**
 * 初始化线索数据
 */
async function initLeads(LeadModel: mongoose.Model<Lead>, users: User[]): Promise<void> {
  const count = await LeadModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 线索数据已存在，跳过初始化');
    return;
  }

  const consultant1 = users.find(u => u.username === 'consultant1');
  const consultant2 = users.find(u => u.username === 'consultant2');

  const leads: Partial<Lead>[] = [
    {
      customerName: '赵先生',
      phone: '13700137001',
      source: '电话咨询',
      intention: LeadIntention.HIGH,
      status: LeadStatus.NEW,
      assigneeId: consultant1?._id,
      assigneeName: consultant1?.name,
      assignedAt: new Date(),
    },
    {
      customerName: '孙女士',
      phone: '13700137002',
      source: '到店咨询',
      intention: LeadIntention.HIGH,
      status: LeadStatus.FOLLOWING,
      assigneeId: consultant1?._id,
      assigneeName: consultant1?.name,
      assignedAt: new Date(Date.now() - 86400000),
    },
    {
      customerName: '周先生',
      phone: '13700137003',
      source: '官网留言',
      intention: LeadIntention.MEDIUM,
      status: LeadStatus.NEW,
      assigneeId: consultant2?._id,
      assigneeName: consultant2?.name,
      assignedAt: new Date(),
    },
    {
      customerName: '吴女士',
      phone: '13700137004',
      source: '朋友介绍',
      intention: LeadIntention.HIGH,
      status: LeadStatus.APPOINTED,
      assigneeId: consultant2?._id,
      assigneeName: consultant2?.name,
      assignedAt: new Date(Date.now() - 172800000),
    },
    {
      customerName: '郑先生',
      phone: '13700137005',
      source: '抖音推广',
      intention: LeadIntention.LOW,
      status: LeadStatus.NEW,
    },
    {
      customerName: '冯女士',
      phone: '13700137006',
      source: '电话咨询',
      intention: LeadIntention.MEDIUM,
      status: LeadStatus.FOLLOWING,
      assigneeId: consultant1?._id,
      assigneeName: consultant1?.name,
      assignedAt: new Date(Date.now() - 259200000),
    },
    {
      customerName: '陈先生',
      phone: '13700137007',
      source: '微信公众号',
      intention: LeadIntention.HIGH,
      status: LeadStatus.COMPLETED,
      assigneeId: consultant2?._id,
      assigneeName: consultant2?.name,
      assignedAt: new Date(Date.now() - 604800000),
    },
    {
      customerName: '褚女士',
      phone: '13700137008',
      source: '到店咨询',
      intention: LeadIntention.LOW,
      status: LeadStatus.LOST,
      assigneeId: consultant1?._id,
      assigneeName: consultant1?.name,
      assignedAt: new Date(Date.now() - 1209600000),
    },
  ];

  await LeadModel.insertMany(leads);
  console.log('[初始化] 插入 8 条线索数据');
}

/**
 * 初始化规则数据
 */
async function initRules(RuleModel: mongoose.Model<Rule>, users: User[]): Promise<void> {
  const count = await RuleModel.countDocuments().exec();
  if (count > 0) {
    console.log('[初始化] 规则数据已存在，跳过初始化');
    return;
  }

  const admin = users.find(u => u.username === 'admin');

  const now = new Date();
  const toggleHistory = [{
    isEnabled: true,
    operatorId: admin!._id,
    operatorName: admin!.name,
    effectiveTime: now,
    timestamp: now,
  }];

  const rules: Partial<Rule>[] = [
    {
      code: 'FOLLOWUP_REMINDER_3D',
      name: '保养后3天回访提醒',
      description: '车辆保养完成后第3天自动创建回访任务',
      category: '回访规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        daysAfterService: 3,
        followupType: 'phone',
        priority: 'high',
        template: '感谢您到店保养，请问您对我们的服务满意吗？',
      },
      toggleHistory,
    },
    {
      code: 'FOLLOWUP_REMINDER_7D',
      name: '保养后7天回访提醒',
      description: '车辆保养完成后第7天自动创建回访任务',
      category: '回访规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        daysAfterService: 7,
        followupType: 'sms',
        priority: 'medium',
        template: '温馨提醒：您的车辆已保养一周，如有任何问题请随时联系我们。',
      },
      toggleHistory,
    },
    {
      code: 'AUTO_ASSIGN_ROUND_ROBIN',
      name: '线索自动分配（轮询）',
      description: '新线索按照轮询方式自动分配给顾问',
      category: '分配规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        assignMode: 'round_robin',
        roles: ['staff'],
        maxDailyLeads: 20,
      },
      toggleHistory,
    },
    {
      code: 'AUTO_ASSIGN_BY_WORKLOAD',
      name: '线索自动分配（按工作量）',
      description: '新线索优先分配给当前工作量最少的顾问',
      category: '分配规则',
      isEnabled: false,
      effectiveTime: now,
      config: {
        assignMode: 'workload',
        roles: ['staff'],
        workloadWeight: {
          newLeads: 1,
          followingLeads: 2,
          appointedLeads: 3,
        },
      },
      toggleHistory: [{
        isEnabled: false,
        operatorId: admin!._id,
        operatorName: admin!.name,
        effectiveTime: now,
        timestamp: now,
      }],
    },
    {
      code: 'LEAD_AUTO_FOLLOWUP',
      name: '线索自动跟进提醒',
      description: '线索未跟进超过24小时自动提醒负责人',
      category: '跟进规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        noFollowupHours: 24,
        reminderType: 'notification',
        repeatReminder: true,
        repeatIntervalHours: 12,
      },
      toggleHistory,
    },
    {
      code: 'APPOINTMENT_REMINDER',
      name: '预约到店提醒',
      description: '预约前1天和预约前1小时自动提醒客户',
      category: '预约规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        reminderTimes: [
          { hoursBefore: 24, channel: 'sms' },
          { hoursBefore: 1, channel: 'sms' },
        ],
        template: '尊敬的{customerName}，您预约的{appointmentTime}保养服务，请准时到店。',
      },
      toggleHistory,
    },
    {
      code: 'NO_SHOW_AUTOMATIC',
      name: '失约自动处理',
      description: '预约时间超过30分钟未到店自动标记为失约',
      category: '预约规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        gracePeriodMinutes: 30,
        autoMarkNoShow: true,
        createFollowupTask: true,
      },
      toggleHistory,
    },
    {
      code: 'MAINTENANCE_REMINDER',
      name: '保养到期提醒',
      description: '根据里程或时间自动提醒下次保养',
      category: '提醒规则',
      isEnabled: true,
      effectiveTime: now,
      config: {
        reminderMileage: 5000,
        reminderDays: 180,
        advanceReminderDays: 7,
        channel: 'sms',
      },
      toggleHistory,
    },
  ];

  await RuleModel.insertMany(rules);
  console.log('[初始化] 插入 8 条规则数据');
}
