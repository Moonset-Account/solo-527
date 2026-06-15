import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserSchema } from './schemas/user.schema.js';
import { DepartmentSchema } from './schemas/department.schema.js';
import { ItemSchema } from './schemas/item.schema.js';
import { ProgressSchema } from './schemas/progress.schema.js';
import { ReviewSchema } from './schemas/review.schema.js';
import { ConfigSchema } from './schemas/config.schema.js';
import { LogSchema } from './schemas/log.schema.js';
import { AttachmentSchema } from './schemas/attachment.schema.js';
import type {
  UserRole,
  UserStatus,
  ItemStatus,
  ItemPriority,
  ReviewConclusion,
} from './common/types/index.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/item-closure';

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const Item = mongoose.model('Item', ItemSchema);
const Progress = mongoose.model('Progress', ProgressSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Config = mongoose.model('Config', ConfigSchema);
const Log = mongoose.model('Log', LogSchema);
const Attachment = mongoose.model('Attachment', AttachmentSchema);

async function run() {
  console.log('🌱 开始种子数据初始化...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ 数据库连接成功');

  await clearCollections();
  await seedDepartments();
  await seedUsers();
  await seedConfigs();
  const depts = await Department.find({});
  const users = await User.find({});
  await seedItems(depts, users);
  await seedReviews();

  console.log('\n🎉 种子数据初始化完成！');
  console.log('👤 默认账号: admin / admin123');
  console.log('👤 PM账号: zhangsan / 123456');
  console.log('👤 PM账号: lisi / 123456');

  await mongoose.disconnect();
}

async function clearCollections() {
  console.log('\n🧹 清空现有数据...');
  await User.deleteMany({});
  await Department.deleteMany({});
  await Item.deleteMany({});
  await Progress.deleteMany({});
  await Review.deleteMany({});
  await Config.deleteMany({});
  await Log.deleteMany({});
  await Attachment.deleteMany({});
  console.log('✅ 清空完成');
}

async function seedDepartments() {
  console.log('\n🏢 创建部门...');
  const depts = [
    { name: '行政部' },
    { name: '人力资源部' },
    { name: '财务部' },
    { name: '技术部' },
    { name: '市场部' },
    { name: '运营部' },
  ];

  for (const dept of depts) {
    const doc = new Department(dept);
    await doc.save();
    console.log(`   ✅ ${dept.name}`);
  }
}

async function hashPwd(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function seedUsers() {
  console.log('\n👥 创建用户...');
  const depts = await Department.find({});
  const adminDept = depts.find((d) => d.name === '行政部')!;
  const hrDept = depts.find((d) => d.name === '人力资源部')!;
  const financeDept = depts.find((d) => d.name === '财务部')!;
  const techDept = depts.find((d) => d.name === '技术部')!;
  const marketDept = depts.find((d) => d.name === '市场部')!;

  const users: Array<{
    username: string;
    password: string;
    name: string;
    role: UserRole;
    department: any;
    status: UserStatus;
  }> = [
    {
      username: 'admin',
      password: await hashPwd('admin123'),
      name: '系统管理员',
      role: 'admin',
      department: adminDept._id,
      status: 'active',
    },
    {
      username: 'zhangsan',
      password: await hashPwd('123456'),
      name: '张三',
      role: 'pm',
      department: techDept._id,
      status: 'active',
    },
    {
      username: 'lisi',
      password: await hashPwd('123456'),
      name: '李四',
      role: 'pm',
      department: marketDept._id,
      status: 'active',
    },
    {
      username: 'wangwu',
      password: await hashPwd('123456'),
      name: '王五',
      role: 'pm',
      department: hrDept._id,
      status: 'active',
    },
    {
      username: 'zhaoliu',
      password: await hashPwd('123456'),
      name: '赵六',
      role: 'pm',
      department: financeDept._id,
      status: 'active',
    },
  ];

  const savedUsers: any[] = [];
  for (const user of users) {
    const doc = new User(user);
    const saved = await doc.save();
    savedUsers.push(saved);
    console.log(`   ✅ ${user.name} (${user.username} / ${user.role})`);
  }

  adminDept.head = savedUsers[0]._id;
  await adminDept.save();
  techDept.head = savedUsers[1]._id;
  await techDept.save();
  marketDept.head = savedUsers[2]._id;
  await marketDept.save();
}

async function seedConfigs() {
  console.log('\n⚙️ 创建系统配置...');
  const configs = [
    { type: 'switch' as const, key: 'overdue_alert', value: true },
    { type: 'switch' as const, key: 'auto_remind', value: true },
    { type: 'switch' as const, key: 'email_notify', value: false },
    { type: 'review_template' as const, key: '已完成', value: true },
    { type: 'review_template' as const, key: '部分完成', value: true },
    { type: 'review_template' as const, key: '未完成', value: true },
    { type: 'review_template' as const, key: '需升级处理', value: true },
  ];

  for (const config of configs) {
    const doc = new Config(config);
    await doc.save();
  }
  console.log('   ✅ 配置创建完成');
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function seedItems(depts: any[], users: any[]) {
  console.log('\n📋 创建事项数据...');

  const admin = users.find((u) => u.username === 'admin');
  const zhangsan = users.find((u) => u.username === 'zhangsan');
  const lisi = users.find((u) => u.username === 'lisi');
  const wangwu = users.find((u) => u.username === 'wangwu');
  const zhaoliu = users.find((u) => u.username === 'zhaoliu');

  const techDept = depts.find((d) => d.name === '技术部');
  const marketDept = depts.find((d) => d.name === '市场部');
  const hrDept = depts.find((d) => d.name === '人力资源部');
  const financeDept = depts.find((d) => d.name === '财务部');
  const adminDept = depts.find((d) => d.name === '行政部');
  const opsDept = depts.find((d) => d.name === '运营部');

  const itemsData: Array<{
    title: string;
    description: string;
    status: ItemStatus;
    priority: ItemPriority;
    department: any;
    assignee: any;
    deadline: Date;
    claimedAt?: Date;
    completedAt?: Date;
  }> = [
    {
      title: '完成新办公区装修验收',
      description: '核对装修合同条款，完成消防、水电、网络验收，提交验收报告',
      status: 'pending',
      priority: 'high',
      department: adminDept._id,
      assignee: null,
      deadline: daysFromNow(3),
    },
    {
      title: '组织Q2季度员工团建活动',
      description: '选择团建地点，统计参与人数，联系供应商，安排行程',
      status: 'pending',
      priority: 'medium',
      department: hrDept._id,
      assignee: null,
      deadline: daysFromNow(7),
    },
    {
      title: '制定下半年招聘计划',
      description: '与各部门负责人沟通招聘需求，制定招聘时间表和预算',
      status: 'pending',
      priority: 'medium',
      department: hrDept._id,
      assignee: null,
      deadline: daysFromNow(10),
    },
    {
      title: '新版员工入职培训材料准备',
      description: '更新公司文化、制度、安全等培训PPT，准备考试题库',
      status: 'in_progress',
      priority: 'medium',
      department: hrDept._id,
      assignee: wangwu._id,
      deadline: daysFromNow(2),
      claimedAt: daysFromNow(-3),
    },
    {
      title: 'CRM系统二期需求梳理',
      description: '收集销售部门反馈，整理二期功能需求，编写PRD文档',
      status: 'in_progress',
      priority: 'high',
      department: techDept._id,
      assignee: zhangsan._id,
      deadline: daysFromNow(5),
      claimedAt: daysFromNow(-5),
    },
    {
      title: '公司官网首页改版',
      description: '配合品牌升级，设计新版首页视觉，前端开发上线',
      status: 'in_progress',
      priority: 'urgent',
      department: techDept._id,
      assignee: zhangsan._id,
      deadline: daysFromNow(1),
      claimedAt: daysFromNow(-7),
    },
    {
      title: '618市场活动方案落地执行',
      description: '协调各渠道资源，跟踪活动数据，每日复盘调整策略',
      status: 'in_progress',
      priority: 'urgent',
      department: marketDept._id,
      assignee: lisi._id,
      deadline: daysFromNow(4),
      claimedAt: daysFromNow(-10),
    },
    {
      title: '完成月度财务报表',
      description: '核对所有账目，制作资产负债表、利润表、现金流量表',
      status: 'overdue',
      priority: 'high',
      department: financeDept._id,
      assignee: zhaoliu._id,
      deadline: daysFromNow(-2),
      claimedAt: daysFromNow(-8),
    },
    {
      title: '客户反馈数据分析报告',
      description: '整理上月客户工单数据，分析问题分布，提出改进建议',
      status: 'overdue',
      priority: 'medium',
      department: opsDept._id,
      assignee: wangwu._id,
      deadline: daysFromNow(-4),
      claimedAt: daysFromNow(-12),
    },
    {
      title: '品牌宣传视频拍摄',
      description: '联系拍摄团队，确定脚本，完成拍摄和后期制作',
      status: 'overdue',
      priority: 'low',
      department: marketDept._id,
      assignee: lisi._id,
      deadline: daysFromNow(-7),
      claimedAt: daysFromNow(-20),
    },
    {
      title: '员工年度体检安排',
      description: '联系体检机构，确定套餐和时间，通知全员预约',
      status: 'completed',
      priority: 'medium',
      department: hrDept._id,
      assignee: wangwu._id,
      deadline: daysFromNow(-5),
      claimedAt: daysFromNow(-15),
      completedAt: daysFromNow(-6),
    },
    {
      title: '办公设备采购',
      description: '统计各部门设备需求，询价招标，完成采购入库',
      status: 'completed',
      priority: 'medium',
      department: adminDept._id,
      assignee: admin._id,
      deadline: daysFromNow(-10),
      claimedAt: daysFromNow(-20),
      completedAt: daysFromNow(-11),
    },
    {
      title: '公司网络安全检查',
      description: '检查防火墙、VPN、弱密码等安全项，提交整改报告',
      status: 'completed',
      priority: 'high',
      department: techDept._id,
      assignee: zhangsan._id,
      deadline: daysFromNow(-8),
      claimedAt: daysFromNow(-14),
      completedAt: daysFromNow(-9),
    },
    {
      title: '新品发布会筹备',
      description: '场地预订、嘉宾邀请、物料准备、流程彩排',
      status: 'pending',
      priority: 'urgent',
      department: marketDept._id,
      assignee: null,
      deadline: daysFromNow(15),
    },
    {
      title: '薪酬体系优化方案',
      description: '调研行业薪酬数据，设计新的薪酬结构，提交董事会审批',
      status: 'in_progress',
      priority: 'high',
      department: hrDept._id,
      assignee: admin._id,
      deadline: daysFromNow(20),
      claimedAt: daysFromNow(-2),
    },
  ];

  for (const itemData of itemsData) {
    const item = new Item(itemData);
    const savedItem = await item.save();
    console.log(
      `   ✅ [${itemData.status}] ${itemData.title} (截止: ${itemData.deadline.toLocaleDateString()})`,
    );

    if (
      itemData.status === 'in_progress' ||
      itemData.status === 'overdue' ||
      itemData.status === 'completed'
    ) {
      await seedProgressForItem(savedItem, itemData, users);
    }
  }
}

async function seedProgressForItem(item: any, itemData: any, users: any[]) {
  const progressTemplates: Record<string, Array<{ content: string; daysAgo: number }>> = {
    '新版员工入职培训材料准备': [
      { content: '已收集各部门制度更新内容，共32份文件', daysAgo: 2 },
      { content: '公司文化部分PPT已完成初稿，待HRD审核', daysAgo: 1 },
    ],
    'CRM系统二期需求梳理': [
      { content: '已与销售总监完成需求访谈，整理17项核心需求', daysAgo: 4 },
      { content: '完成需求优先级排序，P0级8项，P1级6项', daysAgo: 2 },
      { content: '正在编写PRD文档，预计明天下班前完成初稿', daysAgo: 1 },
    ],
    '公司官网首页改版': [
      { content: '视觉设计稿完成，经品牌部门3轮评审通过', daysAgo: 6 },
      { content: '前端页面开发完成80%，剩余交互细节调整', daysAgo: 3 },
      { content: '紧急：Banner素材需市场部今日下班前提供', daysAgo: 0 },
    ],
    '618市场活动方案落地执行': [
      { content: '活动方案确认，预算50万，目标GMV300万', daysAgo: 9 },
      { content: '抖音/小红书KOL已签约12位，覆盖粉丝800万+', daysAgo: 6 },
      { content: '首日销量达成120%预期，爆款库存告急', daysAgo: 2 },
      { content: '追加投放信息流广告预算10万，维持热度', daysAgo: 1 },
    ],
    '完成月度财务报表': [
      { content: '银行对账完成，差异3笔正在核实', daysAgo: 5 },
      { content: '应收款明细整理完毕，逾期3笔需跟进', daysAgo: 3 },
      { content: '⚠️ 税务申报截止临近，需加快进度', daysAgo: 1 },
    ],
    '客户反馈数据分析报告': [
      { content: '导出上月工单数据2156条，完成数据清洗', daysAgo: 10 },
      { content: '问题分类完成：产品功能40%，操作体验28%，其他32%', daysAgo: 7 },
    ],
    '品牌宣传视频拍摄': [
      { content: '完成3家供应商比价，选定A公司', daysAgo: 18 },
      { content: '脚本初稿完成，等待CEO审阅', daysAgo: 14 },
      { content: 'CEO对脚本提出重大修改意见，需重新调整', daysAgo: 9 },
    ],
    '员工年度体检安排': [
      { content: '联系3家体检机构完成比价', daysAgo: 13 },
      { content: '选定爱康国宾，人均预算680元', daysAgo: 10 },
      { content: '预约链接已发全员，128人完成预约', daysAgo: 7 },
    ],
    '办公设备采购': [
      { content: '完成需求统计：笔记本30台，显示器45台，打印机8台', daysAgo: 18 },
      { content: '公开招标，5家供应商参与投标', daysAgo: 15 },
      { content: '中标结果公示，合同签署完成', daysAgo: 12 },
      { content: '设备全部到货验收入库，已发放至各部门', daysAgo: 10 },
    ],
    '公司网络安全检查': [
      { content: '完成外部端口扫描，关闭高危端口3个', daysAgo: 12 },
      { content: '弱密码排查完成，强制重置23个账号密码', daysAgo: 10 },
      { content: 'VPN双因素认证已部署完毕', daysAgo: 8 },
    ],
    '薪酬体系优化方案': [
      { content: '购买行业薪酬报告，获取对标数据', daysAgo: 1 },
    ],
  };

  const templates = progressTemplates[itemData.title] || [];
  const zhangsan = users.find((u) => u.username === 'zhangsan');
  const lisi = users.find((u) => u.username === 'lisi');
  const wangwu = users.find((u) => u.username === 'wangwu');
  const zhaoliu = users.find((u) => u.username === 'zhaoliu');

  for (const tpl of templates) {
    const progress = new Progress({
      itemId: item._id,
      content: tpl.content,
      attachments: [],
      operator: itemData.assignee || zhangsan._id,
      createdAt: daysFromNow(-tpl.daysAgo),
    });
    await progress.save();
  }
}

async function seedReviews() {
  console.log('\n📝 创建复盘数据...');
  const items = await Item.find({ status: 'completed' }).limit(3);
  const admin = await User.findOne({ username: 'admin' });

  const conclusions: ReviewConclusion[] = ['completed', 'partial', 'completed'];
  const remarks = [
    '全部按计划完成，各部门配合顺畅，建议形成标准化流程',
    '基本完成，但预算超支8%，下次采购需增加议价环节',
    '按期完成，安全整改项后续需每季度复核一次',
  ];

  for (let i = 0; i < items.length; i++) {
    const review = new Review({
      itemId: items[i]._id,
      conclusion: conclusions[i],
      remark: remarks[i],
      operator: admin!._id,
    });
    await review.save();
    console.log(`   ✅ ${items[i].title} → ${conclusions[i]}`);
  }
}

run().catch(console.error);
