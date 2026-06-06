import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const passwordHash = await bcrypt.hash('demo123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: '张管理',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: 'designer@demo.com' },
    update: {},
    create: {
      email: 'designer@demo.com',
      name: '李设计',
      passwordHash,
      role: 'DESIGNER',
    },
  });

  const client1 = await prisma.client.create({
    data: {
      name: '科技创新有限公司',
      email: 'contact@techcorp.com',
      phone: '010-12345678',
      address: '北京市海淀区中关村大街1号',
      contactPerson: '王经理',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: '创意设计工作室',
      email: 'hello@creativestudio.com',
      phone: '021-87654321',
      address: '上海市徐汇区淮海中路100号',
      contactPerson: '陈总监',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: '电商平台股份有限公司',
      email: 'support@ecom.com',
      phone: '0755-11112222',
      address: '深圳市南山区科技园',
      contactPerson: '刘总',
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@demo.com' },
    update: {},
    create: {
      email: 'client@demo.com',
      name: '王客户',
      passwordHash,
      role: 'CLIENT',
      clientId: client1.id,
    },
  });

  const project1 = await prisma.project.create({
    data: {
      name: '企业官网改版项目',
      description: '公司官方网站全面改版升级，提升品牌形象和用户体验',
      status: 'IN_PROGRESS',
      budget: 50000,
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-07-15'),
      clientId: client1.id,
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
          { userId: designer.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: '品牌 VI 设计',
      description: '全套品牌视觉识别系统设计',
      status: 'PENDING',
      budget: 30000,
      startDate: new Date('2026-06-10'),
      dueDate: new Date('2026-08-10'),
      clientId: client2.id,
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
          { userId: designer.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: '移动端 App UI 设计',
      description: '电商平台移动端应用界面设计',
      status: 'COMPLETED',
      budget: 80000,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-05-30'),
      clientId: client3.id,
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
          { userId: designer.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: '营销活动页面设计',
      description: '618促销活动专题页面设计',
      status: 'IN_PROGRESS',
      budget: 15000,
      startDate: new Date('2026-05-20'),
      dueDate: new Date('2026-06-15'),
      clientId: client3.id,
      members: {
        create: [
          { userId: designer.id, role: 'MANAGER' },
        ],
      },
    },
  });

  const project5 = await prisma.project.create({
    data: {
      name: '产品手册设计',
      description: '新产品宣传手册设计与排版',
      status: 'ARCHIVED',
      budget: 10000,
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-15'),
      clientId: client1.id,
      members: {
        create: [
          { userId: admin.id, role: 'MANAGER' },
        ],
      },
    },
  });

  const tasksData = [
    { projectId: project1.id, title: '需求调研与分析', status: 'DONE', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 8, timeSpent: 7.5, dueDate: new Date('2026-05-05') },
    { projectId: project1.id, title: '首页设计稿', status: 'DONE', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 16, timeSpent: 18, dueDate: new Date('2026-05-15') },
    { projectId: project1.id, title: '内页设计稿', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: designer.id, timeEstimate: 24, timeSpent: 12, dueDate: new Date('2026-06-10') },
    { projectId: project1.id, title: '响应式适配设计', status: 'TODO', priority: 'MEDIUM', assigneeId: designer.id, timeEstimate: 12, timeSpent: 0, dueDate: new Date('2026-06-25') },
    { projectId: project1.id, title: '设计稿交付与验收', status: 'TODO', priority: 'HIGH', assigneeId: admin.id, timeEstimate: 4, timeSpent: 0, dueDate: new Date('2026-07-10') },
    { projectId: project2.id, title: '品牌调研与定位', status: 'TODO', priority: 'HIGH', assigneeId: admin.id, timeEstimate: 8, timeSpent: 0, dueDate: new Date('2026-06-15') },
    { projectId: project2.id, title: 'Logo 设计方案', status: 'TODO', priority: 'URGENT', assigneeId: designer.id, timeEstimate: 16, timeSpent: 0, dueDate: new Date('2026-06-20') },
    { projectId: project2.id, title: 'VI 基础系统设计', status: 'TODO', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 24, timeSpent: 0, dueDate: new Date('2026-07-05') },
    { projectId: project3.id, title: '用户界面设计', status: 'DONE', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 40, timeSpent: 42, dueDate: new Date('2026-04-15') },
    { projectId: project3.id, title: '交互原型设计', status: 'DONE', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 20, timeSpent: 18, dueDate: new Date('2026-04-01') },
    { projectId: project3.id, title: '设计规范文档', status: 'DONE', priority: 'MEDIUM', assigneeId: designer.id, timeEstimate: 16, timeSpent: 15, dueDate: new Date('2026-05-20') },
    { projectId: project4.id, title: '活动主题视觉设计', status: 'IN_PROGRESS', priority: 'URGENT', assigneeId: designer.id, timeEstimate: 8, timeSpent: 5, dueDate: new Date('2026-06-05') },
    { projectId: project4.id, title: '商品展示模块设计', status: 'TODO', priority: 'HIGH', assigneeId: designer.id, timeEstimate: 10, timeSpent: 0, dueDate: new Date('2026-06-08') },
    { projectId: project4.id, title: '优惠券弹窗设计', status: 'TODO', priority: 'MEDIUM', assigneeId: designer.id, timeEstimate: 4, timeSpent: 0, dueDate: new Date('2026-06-10') },
    { projectId: project5.id, title: '手册内容排版', status: 'DONE', priority: 'MEDIUM', assigneeId: designer.id, timeEstimate: 16, timeSpent: 14, dueDate: new Date('2026-03-01') },
  ];

  for (const task of tasksData) {
    await prisma.task.create({ data: task });
  }

  const timesheetsData = [
    { userId: designer.id, projectId: project1.id, description: '需求调研会议', hours: 3, hourlyRate: 300, workDate: new Date('2026-05-02') },
    { userId: designer.id, projectId: project1.id, description: '竞品分析', hours: 4.5, hourlyRate: 300, workDate: new Date('2026-05-03') },
    { userId: designer.id, projectId: project1.id, description: '首页草图设计', hours: 6, hourlyRate: 300, workDate: new Date('2026-05-08') },
    { userId: designer.id, projectId: project1.id, description: '首页视觉设计', hours: 8, hourlyRate: 300, workDate: new Date('2026-05-09') },
    { userId: designer.id, projectId: project1.id, description: '首页修改优化', hours: 4, hourlyRate: 300, workDate: new Date('2026-05-12') },
    { userId: designer.id, projectId: project1.id, description: '关于我们页面设计', hours: 6, hourlyRate: 300, workDate: new Date('2026-05-20') },
    { userId: designer.id, projectId: project1.id, description: '产品展示页面设计', hours: 6, hourlyRate: 300, workDate: new Date('2026-05-25') },
    { userId: admin.id, projectId: project1.id, description: '客户沟通会议', hours: 2, hourlyRate: 500, workDate: new Date('2026-05-15') },
    { userId: designer.id, projectId: project3.id, description: '主界面设计', hours: 8, hourlyRate: 300, workDate: new Date('2026-03-10') },
    { userId: designer.id, projectId: project3.id, description: '列表页设计', hours: 6, hourlyRate: 300, workDate: new Date('2026-03-12') },
    { userId: designer.id, projectId: project3.id, description: '详情页设计', hours: 8, hourlyRate: 300, workDate: new Date('2026-03-15') },
    { userId: designer.id, projectId: project3.id, description: '个人中心设计', hours: 6, hourlyRate: 300, workDate: new Date('2026-03-18') },
    { userId: designer.id, projectId: project3.id, description: '交互原型制作', hours: 10, hourlyRate: 300, workDate: new Date('2026-03-22') },
    { userId: designer.id, projectId: project3.id, description: '原型评审修改', hours: 8, hourlyRate: 300, workDate: new Date('2026-03-25') },
    { userId: designer.id, projectId: project3.id, description: '设计规范整理', hours: 10, hourlyRate: 300, workDate: new Date('2026-04-10') },
    { userId: designer.id, projectId: project3.id, description: '最终交付准备', hours: 5, hourlyRate: 300, workDate: new Date('2026-05-25') },
    { userId: designer.id, projectId: project4.id, description: '活动主视觉初稿', hours: 5, hourlyRate: 300, workDate: new Date('2026-05-25') },
    { userId: admin.id, projectId: project4.id, description: '活动需求确认', hours: 1.5, hourlyRate: 500, workDate: new Date('2026-05-22') },
    { userId: designer.id, projectId: project5.id, description: '封面设计', hours: 4, hourlyRate: 300, workDate: new Date('2026-02-15') },
    { userId: designer.id, projectId: project5.id, description: '内页排版', hours: 10, hourlyRate: 300, workDate: new Date('2026-02-20') },
  ];

  for (const ts of timesheetsData) {
    await prisma.timesheet.create({ data: ts });
  }

  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'QTE2026050001',
      projectId: project1.id,
      clientId: client1.id,
      subtotal: 47169.81,
      taxRate: 6,
      taxAmount: 2830.19,
      total: 50000,
      status: 'ACCEPTED',
      validUntil: new Date('2026-06-01'),
      notes: '包含官网改版全部设计工作',
      sentAt: new Date('2026-04-25'),
      acceptedAt: new Date('2026-04-28'),
      items: {
        create: [
          { description: '需求调研与分析', quantity: 1, unitPrice: 5000, amount: 5000, sortOrder: 1 },
          { description: '首页设计', quantity: 1, unitPrice: 15000, amount: 15000, sortOrder: 2 },
          { description: '内页设计（10页）', quantity: 10, unitPrice: 2500, amount: 25000, sortOrder: 3 },
          { description: '响应式适配', quantity: 1, unitPrice: 5000, amount: 5000, sortOrder: 4 },
        ],
      },
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      quoteNumber: 'QTE2026050002',
      projectId: project2.id,
      clientId: client2.id,
      subtotal: 28301.89,
      taxRate: 6,
      taxAmount: 1698.11,
      total: 30000,
      status: 'SENT',
      validUntil: new Date('2026-06-20'),
      notes: '品牌VI设计全套方案',
      sentAt: new Date('2026-06-01'),
      items: {
        create: [
          { description: '品牌调研与定位', quantity: 1, unitPrice: 5000, amount: 5000, sortOrder: 1 },
          { description: 'Logo设计（3套方案）', quantity: 1, unitPrice: 12000, amount: 12000, sortOrder: 2 },
          { description: 'VI基础系统', quantity: 1, unitPrice: 10000, amount: 10000, sortOrder: 3 },
          { description: 'VI应用部分', quantity: 1, unitPrice: 3000, amount: 3000, sortOrder: 4 },
        ],
      },
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV2026050001',
      projectId: project3.id,
      clientId: client3.id,
      quoteId: null,
      subtotal: 75471.70,
      taxRate: 6,
      taxAmount: 4528.30,
      total: 80000,
      amountPaid: 80000,
      status: 'PAID',
      issueDate: new Date('2026-05-25'),
      dueDate: new Date('2026-06-25'),
      notes: 'App UI设计项目全款',
      sentAt: new Date('2026-05-26'),
      paidAt: new Date('2026-06-05'),
      items: {
        create: [
          { description: '用户界面设计', quantity: 1, unitPrice: 50000, amount: 50000, sortOrder: 1 },
          { description: '交互原型设计', quantity: 1, unitPrice: 20000, amount: 20000, sortOrder: 2 },
          { description: '设计规范文档', quantity: 1, unitPrice: 10000, amount: 10000, sortOrder: 3 },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV2026050002',
      projectId: project1.id,
      clientId: client1.id,
      quoteId: quote1.id,
      subtotal: 23584.91,
      taxRate: 6,
      taxAmount: 1415.09,
      total: 25000,
      amountPaid: 25000,
      status: 'PAID',
      issueDate: new Date('2026-05-10'),
      dueDate: new Date('2026-05-25'),
      notes: '项目首付款 50%',
      sentAt: new Date('2026-05-10'),
      paidAt: new Date('2026-05-15'),
      items: {
        create: [
          { description: '官网改版项目 - 首付款', quantity: 1, unitPrice: 25000, amount: 25000, sortOrder: 1 },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV2026060001',
      projectId: project5.id,
      clientId: client1.id,
      quoteId: null,
      subtotal: 9433.96,
      taxRate: 6,
      taxAmount: 566.04,
      total: 10000,
      amountPaid: 0,
      status: 'OVERDUE',
      issueDate: new Date('2026-03-20'),
      dueDate: new Date('2026-04-20'),
      notes: '产品手册设计费',
      sentAt: new Date('2026-03-20'),
      items: {
        create: [
          { description: '产品手册设计', quantity: 1, unitPrice: 10000, amount: 10000, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 80000,
      paymentDate: new Date('2026-06-05'),
      method: 'BANK',
      transactionId: 'BANK202606050001',
      notes: '银行转账收到',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 25000,
      paymentDate: new Date('2026-05-15'),
      method: 'ONLINE',
      transactionId: 'WX202605150001',
      notes: '微信转账收到',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      action: 'CREATE',
      entityType: 'PROJECT',
      entityId: project1.id,
      newValues: JSON.stringify({ name: project1.name, status: 'PENDING' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      action: 'STATUS_CHANGE',
      entityType: 'PROJECT',
      entityId: project1.id,
      oldValues: JSON.stringify({ status: 'PENDING' }),
      newValues: JSON.stringify({ status: 'IN_PROGRESS' }),
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: '项目开始', content: '企业官网改版项目已启动', type: 'PROJECT_UPDATE', entityId: project1.id, entityType: 'PROJECT' },
      { userId: designer.id, title: '新任务分配', content: '您有新的任务需要处理', type: 'TASK_ASSIGNED', entityId: tasksData[2].title, entityType: 'TASK' },
      { userId: admin.id, title: '发票已逾期', content: '产品手册设计费发票已逾期，请跟进', type: 'INVOICE_OVERDUE', entityId: invoice3.id, entityType: 'INVOICE' },
    ],
  });

  console.log('数据播种完成！');
  console.log('测试账号：');
  console.log('管理员: admin@demo.com / demo123456');
  console.log('设计师: designer@demo.com / demo123456');
  console.log('客户: client@demo.com / demo123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
