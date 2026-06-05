import { PrismaClient, Role } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      email: 'owner@test.com',
      name: '业主张三',
      password,
      role: Role.OWNER,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@test.com' },
    update: {},
    create: {
      email: 'pm@test.com',
      name: '项目经理李四',
      password,
      role: Role.PROJECT_MANAGER,
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: 'designer@test.com' },
    update: {},
    create: {
      email: 'designer@test.com',
      name: '设计师王五',
      password,
      role: Role.DESIGNER,
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@test.com' },
    update: {},
    create: {
      email: 'finance@test.com',
      name: '财务赵六',
      password,
      role: Role.FINANCE,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'demo-project' },
    update: {},
    create: {
      id: 'demo-project',
      name: '阳光花园装修项目',
      address: '北京市朝阳区阳光花园1号楼101室',
      ownerId: owner.id,
    },
  });

  const schedule1 = await prisma.schedule.upsert({
    where: { id: 'schedule-1' },
    update: {},
    create: {
      id: 'schedule-1',
      projectId: project.id,
      taskName: '厨房瓷砖铺设',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-15'),
    },
  });

  const schedule2 = await prisma.schedule.upsert({
    where: { id: 'schedule-2' },
    update: {},
    create: {
      id: 'schedule-2',
      projectId: project.id,
      taskName: '卫生间防水',
      startDate: new Date('2026-06-16'),
      endDate: new Date('2026-06-18'),
    },
  });

  console.log('数据库初始化完成！');
  console.log('测试账号：');
  console.log('业主: owner@test.com / password');
  console.log('项目经理: pm@test.com / password');
  console.log('设计师: designer@test.com / password');
  console.log('财务: finance@test.com / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
