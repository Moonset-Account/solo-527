import { PrismaClient, Role, ProjectStatus, TaskStatus, BudgetCategory, TaskPriority, FileStatus, ConfirmationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wedding.com' },
    update: {},
    create: {
      email: 'admin@wedding.com',
      name: '系统管理员',
      password: hashedPassword,
      role: Role.ADMIN,
      phone: '13800138000',
    },
  });

  const planner = await prisma.user.upsert({
    where: { email: 'planner@wedding.com' },
    update: {},
    create: {
      email: 'planner@wedding.com',
      name: '婚礼策划师李姐',
      password: hashedPassword,
      role: Role.PLANNER,
      phone: '13800138001',
    },
  });

  const couple = await prisma.user.upsert({
    where: { email: 'couple@wedding.com' },
    update: {},
    create: {
      email: 'couple@wedding.com',
      name: '张先生 & 王小姐',
      password: hashedPassword,
      role: Role.COUPLE,
      phone: '13800138002',
    },
  });

  const floristSupplier = await prisma.user.upsert({
    where: { email: 'florist@wedding.com' },
    update: {},
    create: {
      email: 'florist@wedding.com',
      name: '花艺师小林',
      password: hashedPassword,
      role: Role.SUPPLIER,
      phone: '13800138003',
    },
  });

  const photographerSupplier = await prisma.user.upsert({
    where: { email: 'photographer@wedding.com' },
    update: {},
    create: {
      email: 'photographer@wedding.com',
      name: '摄影师老王',
      password: hashedPassword,
      role: Role.SUPPLIER,
      phone: '13800138004',
    },
  });

  const venueSupplier = await prisma.supplier.upsert({
    where: { id: 'venue-1' },
    update: {},
    create: {
      id: 'venue-1',
      name: '浪漫海岸婚礼会所',
      category: '场地',
      contactName: '陈经理',
      phone: '13800138005',
      email: 'venue@example.com',
      address: '上海市浦东新区滨江大道88号',
      rating: 4.8,
      services: {
        create: [
          { name: '周末全天场地', basePrice: 28000, unit: '场' },
          { name: '工作日半天场地', basePrice: 15000, unit: '场' },
          { name: '基础桌椅布置', basePrice: 5000, unit: '套' },
        ],
      },
    },
  });

  const florist = await prisma.supplier.upsert({
    where: { id: 'florist-1' },
    update: { userId: floristSupplier.id },
    create: {
      id: 'florist-1',
      name: '花语间花艺工作室',
      category: '花艺',
      contactName: '小林',
      phone: '13800138003',
      email: 'florist@example.com',
      address: '上海市静安区巨鹿路123号',
      rating: 4.9,
      userId: floristSupplier.id,
      services: {
        create: [
          { name: '新娘手捧花', basePrice: 1200, unit: '束' },
          { name: '仪式区花艺布置', basePrice: 8000, unit: '套' },
          { name: '桌花', basePrice: 300, unit: '桌' },
          { name: '胸花腕花', basePrice: 100, unit: '个' },
        ],
      },
    },
  });

  const photographer = await prisma.supplier.upsert({
    where: { id: 'photographer-1' },
    update: { userId: photographerSupplier.id },
    create: {
      id: 'photographer-1',
      name: '光影记忆摄影工作室',
      category: '摄影',
      contactName: '老王',
      phone: '13800138004',
      email: 'photo@example.com',
      address: '上海市徐汇区淮海中路456号',
      rating: 4.7,
      userId: photographerSupplier.id,
      services: {
        create: [
          { name: '双机全天跟拍', basePrice: 12800, unit: '天' },
          { name: '单机半天跟拍', basePrice: 6800, unit: '半天' },
          { name: '精修照片', basePrice: 50, unit: '张' },
        ],
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'project-001' },
    update: {},
    create: {
      id: 'project-001',
      name: '张先生 & 王小姐 婚礼',
      description: '2024年秋季户外海边婚礼，浪漫简约风格',
      weddingDate: new Date('2024-10-18T16:00:00'),
      venue: '浪漫海岸婚礼会所',
      status: ProjectStatus.IN_PROGRESS,
      totalBudget: 150000,
      totalSpent: 45000,
      managerId: planner.id,
      coupleId: couple.id,
      tasks: {
        create: [
          {
            title: '确认婚礼场地',
            description: '与浪漫海岸会所确认场地细节和日期',
            status: TaskStatus.COMPLETED,
            priority: TaskPriority.URGENT,
            dueDate: new Date('2024-08-15'),
            completedAt: new Date('2024-08-10'),
            creatorId: planner.id,
            assigneeId: planner.id,
          },
          {
            title: '花艺方案设计',
            description: '根据新人喜好设计花艺布置方案',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: new Date('2024-09-01'),
            startedAt: new Date('2024-08-20'),
            creatorId: planner.id,
            assigneeId: floristSupplier.id,
          },
          {
            title: '确认摄影团队',
            description: '与摄影师确认拍摄风格和流程',
            status: TaskStatus.REVIEW,
            priority: TaskPriority.HIGH,
            dueDate: new Date('2024-09-05'),
            creatorId: planner.id,
            assigneeId: photographerSupplier.id,
          },
          {
            title: '设计稿确认',
            description: '婚礼现场效果图设计，需新人确认',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date('2024-09-15'),
            creatorId: planner.id,
            assigneeId: planner.id,
          },
          {
            title: '摄影样片交付',
            description: '摄影师提交拍摄样片供审核',
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            dueDate: new Date('2024-09-10'),
            creatorId: planner.id,
            assigneeId: photographerSupplier.id,
          },
          {
            title: '宾客名单确认',
            description: '新人提供最终宾客名单',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date('2024-09-25'),
            creatorId: planner.id,
            assigneeId: couple.id,
          },
          {
            title: '试菜',
            description: '安排新人到场地试菜确认菜单',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date('2024-09-20'),
            creatorId: planner.id,
          },
        ],
      },
      budgetItems: {
        create: [
          {
            category: BudgetCategory.VENUE,
            description: '婚礼场地租赁（含基础布置）',
            estimated: 35000,
            actual: 35000,
            isInternal: false,
            supplierId: venueSupplier.id,
          },
          {
            category: BudgetCategory.VENUE,
            description: '场地内部服务费（不向客户展示）',
            estimated: 5000,
            actual: 5000,
            isInternal: true,
            supplierId: venueSupplier.id,
          },
          {
            category: BudgetCategory.FLORISTRY,
            description: '全场花艺布置',
            estimated: 25000,
            actual: 5000,
            isInternal: false,
            supplierId: florist.id,
          },
          {
            category: BudgetCategory.PHOTOGRAPHY,
            description: '双机摄影跟拍+精修50张',
            estimated: 15000,
            actual: 0,
            isInternal: false,
            supplierId: photographer.id,
          },
          {
            category: BudgetCategory.CATERING,
            description: '20桌婚宴餐饮',
            estimated: 60000,
            actual: 0,
            isInternal: false,
          },
          {
            category: BudgetCategory.OTHER,
            description: '其他杂项备用金',
            estimated: 10000,
            actual: 0,
            isInternal: false,
          },
        ],
      },
      files: {
        create: [
          {
            name: '婚礼场地实景图.jpg',
            url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
            type: 'image/jpeg',
            size: 1024000,
            status: FileStatus.APPROVED,
            category: 'venue',
            uploadedById: planner.id,
          },
          {
            name: '花艺设计初稿.pdf',
            url: 'https://example.com/floral-design-v1.pdf',
            type: 'application/pdf',
            size: 2048000,
            status: FileStatus.PENDING,
            category: 'design',
            uploadedById: floristSupplier.id,
          },
        ],
      },
      confirmations: {
        create: [
          {
            title: '婚礼日期和场地确认',
            content: '确认2024年10月18日在浪漫海岸婚礼会所举办婚礼',
            status: ConfirmationStatus.CONFIRMED,
            confirmedAt: new Date('2024-08-10'),
          },
          {
            title: '花艺方案确认',
            content: '请确认花艺设计方案及报价',
            status: ConfirmationStatus.PENDING,
          },
        ],
      },
      comments: {
        create: [
          {
            content: '场地已经确认好啦，期待后续的安排！',
            authorId: couple.id,
          },
          {
            content: '花艺方案我会在本周内完成初稿',
            authorId: floristSupplier.id,
          },
        ],
      },
      reminders: {
        create: [
          {
            title: '花艺方案截止日提醒',
            message: '花艺方案设计需在9月1日前完成',
            remindAt: new Date('2024-08-31T09:00:00'),
            isSent: false,
          },
          {
            title: '婚礼倒计时30天',
            message: '距离婚礼还有30天，请确认所有准备工作进度',
            remindAt: new Date('2024-09-18T09:00:00'),
            isSent: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('   管理员: admin@wedding.com / password123');
  console.log('   策划师: planner@wedding.com / password123');
  console.log('   新人:   couple@wedding.com / password123');
  console.log('   花艺师: florist@wedding.com / password123');
  console.log('   摄影师: photographer@wedding.com / password123');
  console.log('');
  console.log('📁 Project: ' + project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
