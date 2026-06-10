const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const grids = await Promise.all([
    prisma.grid.upsert({
      where: { code: 'GRID-A01' },
      update: {},
      create: { name: 'A区网格', code: 'GRID-A01', area: 'A区1-10号楼', description: 'A区责任网格' }
    }),
    prisma.grid.upsert({
      where: { code: 'GRID-B01' },
      update: {},
      create: { name: 'B区网格', code: 'GRID-B01', area: 'B区1-8号楼', description: 'B区责任网格' }
    }),
    prisma.grid.upsert({
      where: { code: 'GRID-C01' },
      update: {},
      create: { name: 'C区网格', code: 'GRID-C01', area: 'C区1-12号楼', description: 'C区责任网格' }
    }),
    prisma.grid.upsert({
      where: { code: 'GRID-D01' },
      update: {},
      create: { name: 'D区网格', code: 'GRID-D01', area: 'D区商业区', description: 'D区商业网格' }
    }),
  ]);
  console.log('网格数据已创建');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800000000',
    }
  });

  const workers = await Promise.all([
    prisma.user.upsert({
      where: { username: 'worker1' },
      update: {},
      create: {
        username: 'worker1',
        password: hashedPassword,
        name: '张网格',
        role: 'GRID_WORKER',
        gridId: grids[0].id,
        phone: '13800138001',
      }
    }),
    prisma.user.upsert({
      where: { username: 'worker2' },
      update: {},
      create: {
        username: 'worker2',
        password: hashedPassword,
        name: '李网格',
        role: 'GRID_WORKER',
        gridId: grids[1].id,
        phone: '13800138002',
      }
    }),
    prisma.user.upsert({
      where: { username: 'worker3' },
      update: {},
      create: {
        username: 'worker3',
        password: hashedPassword,
        name: '王网格',
        role: 'GRID_WORKER',
        gridId: grids[2].id,
        phone: '13800138003',
      }
    }),
  ]);
  console.log('用户数据已创建');

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'DEPT-MAINTENANCE' },
      update: {},
      create: { name: '设施维修部', code: 'DEPT-MAINTENANCE', type: '维修', contact: '王经理', phone: '13900139001' }
    }),
    prisma.department.upsert({
      where: { code: 'DEPT-ENVIRONMENT' },
      update: {},
      create: { name: '环境保洁部', code: 'DEPT-ENVIRONMENT', type: '环境', contact: '李主管', phone: '13900139002' }
    }),
    prisma.department.upsert({
      where: { code: 'DEPT-SECURITY' },
      update: {},
      create: { name: '安保部', code: 'DEPT-SECURITY', type: '安保', contact: '张队长', phone: '13900139003' }
    }),
    prisma.department.upsert({
      where: { code: 'DEPT-CIVIC' },
      update: {},
      create: { name: '市政服务部', code: 'DEPT-CIVIC', type: '公共服务', contact: '刘主任', phone: '13900139004' }
    }),
  ]);
  console.log('部门数据已创建');

  const facilities = await Promise.all([
    prisma.facility.upsert({
      where: { code: 'FAC-STREETLAMP-001' },
      update: {},
      create: {
        name: 'A区1号路灯',
        code: 'FAC-STREETLAMP-001',
        type: '路灯',
        location: 'A区1号楼前',
        gridId: grids[0].id,
        status: 'NORMAL',
        description: '太阳能LED路灯'
      }
    }),
    prisma.facility.upsert({
      where: { code: 'FAC-STREETLAMP-002' },
      update: {},
      create: {
        name: 'B区3号路灯',
        code: 'FAC-STREETLAMP-002',
        type: '路灯',
        location: 'B区3单元门口',
        gridId: grids[1].id,
        status: 'DAMAGED',
        description: '传统高压钠灯'
      }
    }),
    prisma.facility.upsert({
      where: { code: 'FAC-HYDRANT-001' },
      update: {},
      create: {
        name: 'C区消防栓',
        code: 'FAC-HYDRANT-001',
        type: '消防设施',
        location: 'C区花园东侧',
        gridId: grids[2].id,
        status: 'NORMAL',
        description: '室外消防栓'
      }
    }),
    prisma.facility.upsert({
      where: { code: 'FAC-BIN-001' },
      update: {},
      create: {
        name: 'D区分类垃圾桶',
        code: 'FAC-BIN-001',
        type: '环卫设施',
        location: 'D区商业街入口',
        gridId: grids[3].id,
        status: 'NORMAL',
        description: '四分类垃圾桶组'
      }
    }),
    prisma.facility.upsert({
      where: { code: 'FAC-BENCH-001' },
      update: {},
      create: {
        name: 'A区休息长椅',
        code: 'FAC-BENCH-001',
        type: '休闲设施',
        location: 'A区中心花园',
        gridId: grids[0].id,
        status: 'NORMAL',
        description: '防腐木长椅'
      }
    }),
    prisma.facility.upsert({
      where: { code: 'FAC-MONITOR-001' },
      update: {},
      create: {
        name: 'B区监控摄像头',
        code: 'FAC-MONITOR-001',
        type: '安防设施',
        location: 'B区北门',
        gridId: grids[1].id,
        status: 'MAINTENANCE',
        description: '高清网络摄像头'
      }
    }),
  ]);
  console.log('设施数据已创建');

  const eventTypes = ['FACILITY_DAMAGE', 'ENVIRONMENT', 'SECURITY', 'PUBLIC_SERVICE', 'OTHER'];
  const eventLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const eventStatuses = ['PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'CLOSED'];
  const eventTitles = [
    { title: '路灯损坏夜间出行不便', type: 'FACILITY_DAMAGE' },
    { title: '垃圾堆积异味严重', type: 'ENVIRONMENT' },
    { title: '消防栓漏水', type: 'FACILITY_DAMAGE' },
    { title: '小区门岗管理松懈', type: 'SECURITY' },
    { title: '楼道杂物堆积', type: 'ENVIRONMENT' },
    { title: '健身器材损坏', type: 'FACILITY_DAMAGE' },
    { title: '噪音扰民', type: 'PUBLIC_SERVICE' },
    { title: '井盖破损', type: 'FACILITY_DAMAGE' },
    { title: '流浪狗出没', type: 'SECURITY' },
    { title: '绿化养护不到位', type: 'ENVIRONMENT' },
    { title: '电梯故障', type: 'FACILITY_DAMAGE' },
    { title: '路灯照明时间不合理', type: 'PUBLIC_SERVICE' },
    { title: '停车位纠纷', type: 'OTHER' },
    { title: '下水道堵塞', type: 'FACILITY_DAMAGE' },
    { title: '宣传栏内容过期', type: 'PUBLIC_SERVICE' },
  ];

  const events = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const eventInfo = eventTitles[Math.floor(Math.random() * eventTitles.length)];
    const gridIndex = Math.floor(Math.random() * grids.length);
    const workerIndex = Math.floor(Math.random() * workers.length);
    const statusIndex = Math.floor(Math.random() * eventStatuses.length);
    const levelIndex = Math.floor(Math.random() * eventLevels.length);

    const eventData = {
      title: eventInfo.title,
      description: `${eventInfo.title}，请相关部门尽快处理。`,
      type: eventInfo.type,
      level: eventLevels[levelIndex],
      status: eventStatuses[statusIndex],
      location: `${grids[gridIndex].name} - ${['1号楼前', '中心花园', '商业街', '北门', '停车场'][Math.floor(Math.random() * 5)]}`,
      gridId: grids[gridIndex].id,
      reporterId: workers[workerIndex].id,
      isEffective: Math.random() > 0.1,
      createdAt: dayjs().subtract(daysAgo, 'day').toDate(),
    };

    if (eventStatuses[statusIndex] !== 'PENDING') {
      eventData.departmentId = departments[Math.floor(Math.random() * departments.length)].id;
    }

    if (eventStatuses[statusIndex] === 'COMPLETED' || eventStatuses[statusIndex] === 'CLOSED') {
      eventData.completedAt = dayjs().subtract(Math.max(0, daysAgo - Math.floor(Math.random() * 5)), 'day').toDate();
    }

    const event = await prisma.event.create({ data: eventData });
    events.push(event);

    await prisma.operationLog.create({
      data: {
        eventId: event.id,
        action: '创建事件',
        operatorId: workers[workerIndex].id,
        operatorName: workers[workerIndex].name,
        details: { title: event.title },
        status: 'SUCCESS',
        createdAt: event.createdAt,
      }
    });

    if (event.status === 'ASSIGNED' || event.status === 'PROCESSING' || event.status === 'COMPLETED' || event.status === 'CLOSED') {
      await prisma.operationLog.create({
        data: {
          eventId: event.id,
          action: '指派事件',
          operatorId: admin.id,
          operatorName: admin.name,
          details: { departmentId: event.departmentId },
          status: 'SUCCESS',
          createdAt: dayjs(event.createdAt).add(1, 'hour').toDate(),
        }
      });

      if (event.departmentId) {
        await prisma.notification.create({
          data: {
            userId: workers[workerIndex].id,
            title: '事件已分派',
            content: `您上报的事件「${event.title}」已分派处理`,
            type: 'EVENT',
            eventId: event.id,
            isRead: Math.random() > 0.5,
          }
        });
      }
    }

    if (event.status === 'PROCESSING') {
      await prisma.operationLog.create({
        data: {
          eventId: event.id,
          action: '开始处理',
          operatorId: admin.id,
          operatorName: admin.name,
          details: { status: 'PROCESSING' },
          status: 'SUCCESS',
          createdAt: dayjs(event.createdAt).add(3, 'hour').toDate(),
        }
      });
    }

    if ((event.status === 'COMPLETED' || event.status === 'CLOSED') && event.type === 'FACILITY_DAMAGE') {
      await prisma.volunteerService.create({
        data: {
          eventId: event.id,
          volunteerName: ['张志愿', '李志愿', '王志愿'][Math.floor(Math.random() * 3)],
          volunteerPhone: '137' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
          serviceHours: parseFloat((1 + Math.random() * 4).toFixed(1)),
          serviceDate: dayjs(event.createdAt).add(1, 'day').toDate(),
          description: '参与设施维修志愿服务',
        }
      });
    }
  }
  console.log(`已创建 ${events.length} 条事件数据`);

  console.log('种子数据填充完成！');
  console.log('');
  console.log('测试账号：');
  console.log('  管理员: admin / 123456');
  console.log('  网格员: worker1 / 123456 (张网格)');
  console.log('  网格员: worker2 / 123456 (李网格)');
  console.log('  网格员: worker3 / 123456 (王网格)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
