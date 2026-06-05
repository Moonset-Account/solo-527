import { db } from '../src/db';
import { users, clients, projects, tasks, timeEntries, quotes, invoices, notifications, auditLogs } from '../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 开始初始化数据库...');

  const adminId = uuidv4();
  const clientUserId = uuidv4();
  const clientId = uuidv4();
  const project1Id = uuidv4();
  const project2Id = uuidv4();
  const task1Id = uuidv4();
  const task2Id = uuidv4();

  console.log('👤 创建用户...');
  await db.insert(users).values([
    {
      id: adminId,
      name: '管理员',
      email: 'admin@demo.com',
      passwordHash: 'demo',
      role: 'admin',
    },
    {
      id: clientUserId,
      name: '张三',
      email: 'client@demo.com',
      passwordHash: 'demo',
      role: 'client',
    },
  ]);

  console.log('🏢 创建客户...');
  await db.insert(clients).values([
    {
      id: clientId,
      userId: clientUserId,
      companyName: '科技有限公司',
      contactPerson: '张三',
      phone: '13800138000',
      address: '北京市朝阳区xxx路xxx号',
    },
  ]);

  console.log('📁 创建项目...');
  await db.insert(projects).values([
    {
      id: project1Id,
      clientId,
      name: '官网设计项目',
      description: '企业官网整体视觉设计与开发',
      status: 'active',
      totalAmount: 50000,
      internalCost: 20000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-30'),
      createdBy: adminId,
    },
    {
      id: project2Id,
      clientId,
      name: '品牌VI设计',
      description: '品牌视觉识别系统设计',
      status: 'completed',
      totalAmount: 30000,
      internalCost: 12000,
      startDate: new Date('2023-11-01'),
      endDate: new Date('2023-12-31'),
      createdBy: adminId,
    },
  ]);

  console.log('✅ 创建任务...');
  await db.insert(tasks).values([
    {
      id: task1Id,
      projectId: project1Id,
      name: '需求调研与分析',
      status: 'done',
      hourlyRate: 500,
      sortOrder: 1,
    },
    {
      id: task2Id,
      projectId: project1Id,
      name: '视觉设计',
      status: 'in_progress',
      hourlyRate: 600,
      sortOrder: 2,
    },
  ]);

  console.log('⏰ 创建工时记录...');
  await db.insert(timeEntries).values([
    {
      id: uuidv4(),
      taskId: task1Id,
      projectId: project1Id,
      userId: adminId,
      startTime: new Date('2024-01-16T09:00:00'),
      endTime: new Date('2024-01-16T12:30:00'),
      durationMinutes: 210,
      description: '客户需求沟通会议',
      isBillable: true,
    },
    {
      id: uuidv4(),
      taskId: task2Id,
      projectId: project1Id,
      userId: adminId,
      startTime: new Date('2024-01-17T14:00:00'),
      endTime: new Date('2024-01-17T18:00:00'),
      durationMinutes: 240,
      description: '首页设计稿初稿',
      isBillable: true,
    },
  ]);

  console.log('📄 创建报价单...');
  await db.insert(quotes).values([
    {
      id: uuidv4(),
      projectId: project1Id,
      quoteNumber: 'Q2024010001',
      title: '官网设计项目报价',
      totalAmount: 50000,
      status: 'accepted',
      version: 1,
      validUntil: new Date('2024-02-15'),
      sentAt: new Date('2024-01-10'),
      acceptedAt: new Date('2024-01-12'),
      createdBy: adminId,
    },
  ]);

  console.log('🧾 创建发票...');
  await db.insert(invoices).values([
    {
      id: uuidv4(),
      projectId: project1Id,
      invoiceNumber: 'INV2024020001',
      title: '官网设计-首付款',
      totalAmount: 25000,
      paidAmount: 25000,
      status: 'paid',
      dueDate: new Date('2024-02-15'),
      sentAt: new Date('2024-02-01'),
      paidAt: new Date('2024-02-05'),
      createdBy: adminId,
    },
  ]);

  console.log('🔔 创建通知...');
  await db.insert(notifications).values([
    {
      id: uuidv4(),
      userId: clientUserId,
      type: 'payment_due',
      title: '付款提醒',
      content: '发票 INV2024020001 即将到期，请及时付款。',
      status: 'sent',
      sentAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
    },
  ]);

  console.log('📝 创建审计日志...');
  await db.insert(auditLogs).values([
    {
      id: uuidv4(),
      userId: adminId,
      action: 'create',
      entityType: 'project',
      entityId: project1Id,
      changes: JSON.stringify({ name: { before: null, after: '官网设计项目' } }),
    },
    {
      id: uuidv4(),
      userId: adminId,
      action: 'update',
      entityType: 'project',
      entityId: project1Id,
      changes: JSON.stringify({ status: { before: 'draft', after: 'active' } }),
    },
  ]);

  console.log('✅ 数据库初始化完成！');
  console.log('');
  console.log('演示账户:');
  console.log('  管理员: admin@demo.com / admin123');
  console.log('  客户: client@demo.com / client123');
  console.log('');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ 初始化失败:', error);
  process.exit(1);
});
