const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@example.com',
      status: 'ACTIVE',
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      email: 'admin@example.com',
      phone: '13800000000',
      status: 'ACTIVE',
    },
  });

  const director = await prisma.user.upsert({
    where: { username: 'director' },
    update: {
      email: 'director@example.com',
      status: 'ACTIVE',
    },
    create: {
      username: 'director',
      password: hashedPassword,
      name: '车间主任',
      role: 'WORKSHOP_DIRECTOR',
      email: 'director@example.com',
      phone: '13800000001',
      status: 'ACTIVE',
    },
  });

  const equipments = await Promise.all([
    prisma.equipment.upsert({
      where: { code: 'INJ-001' },
      update: {},
      create: {
        code: 'INJ-001',
        name: '注塑机1号',
        model: 'HAITIAN MA1600',
        status: 'IDLE',
        qrCode: 'EQ-INJ-001',
        location: 'A区-01',
        description: '160吨注塑机',
      },
    }),
    prisma.equipment.upsert({
      where: { code: 'INJ-002' },
      update: {},
      create: {
        code: 'INJ-002',
        name: '注塑机2号',
        model: 'HAITIAN MA2500',
        status: 'IDLE',
        qrCode: 'EQ-INJ-002',
        location: 'A区-02',
        description: '250吨注塑机',
      },
    }),
    prisma.equipment.upsert({
      where: { code: 'INJ-003' },
      update: {},
      create: {
        code: 'INJ-003',
        name: '注塑机3号',
        model: 'HAITIAN MA3800',
        status: 'IDLE',
        qrCode: 'EQ-INJ-003',
        location: 'B区-01',
        description: '380吨注塑机',
      },
    }),
  ]);

  const processes = await Promise.all([
    prisma.process.upsert({
      where: { code: 'PROC-001' },
      update: {},
      create: { code: 'PROC-001', name: '上料', sequence: 1, description: '原料上料烘干' },
    }),
    prisma.process.upsert({
      where: { code: 'PROC-002' },
      update: {},
      create: { code: 'PROC-002', name: '调模', sequence: 2, description: '模具安装调试' },
    }),
    prisma.process.upsert({
      where: { code: 'PROC-003' },
      update: {},
      create: { code: 'PROC-003', name: '试生产', sequence: 3, description: '小批量试生产' },
    }),
    prisma.process.upsert({
      where: { code: 'PROC-004' },
      update: {},
      create: { code: 'PROC-004', name: '量产', sequence: 4, description: '正式批量生产' },
    }),
    prisma.process.upsert({
      where: { code: 'PROC-005' },
      update: {},
      create: { code: 'PROC-005', name: '检验', sequence: 5, description: '成品质量检验' },
    }),
    prisma.process.upsert({
      where: { code: 'PROC-006' },
      update: {},
      create: { code: 'PROC-006', name: '入库', sequence: 6, description: '成品入库' },
    }),
  ]);

  console.log('种子数据创建完成:');
  console.log('管理员账号: admin / 123456');
  console.log('车间主任账号: director / 123456');
  console.log(`设备: ${equipments.length} 台`);
  console.log(`工序: ${processes.length} 道`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
