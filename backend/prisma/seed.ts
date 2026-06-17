import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  const hashedPassword = await bcrypt.hash('Admin@2024', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '超级管理员',
      role: 'super',
    },
  });
  console.log('✅ 管理员账号创建成功: admin / Admin@2024');

  const closeReasons = [
    { name: '信息虚假/伪造证件', category: '资料问题', sortOrder: 1 },
    { name: '重复报名', category: '规则问题', sortOrder: 2 },
    { name: '身份不符(非目标人群)', category: '资格问题', sortOrder: 3 },
    { name: '联系不上参会者', category: '沟通问题', sortOrder: 4 },
    { name: '参会者主动取消', category: '用户侧', sortOrder: 5 },
    { name: '名额已满超售关闭', category: '运营侧', sortOrder: 6 },
    { name: '其他(需备注)', category: '其他', sortOrder: 99 },
  ];
  for (const r of closeReasons) {
    await prisma.closeReason.upsert({
      where: { id: uuidv4() },
      update: {},
      create: r,
    });
  }
  console.log('✅ 关闭原因字典创建成功');

  const ticketNormal = await prisma.ticketType.upsert({
    where: { id: uuidv4() },
    update: {},
    create: {
      name: '普通通票',
      level: 'normal',
      price: 1999,
      totalInventory: 500,
      warningThreshold: 50,
      isOnSale: true,
      description: '包含主论坛+分论坛通票，含工作午餐、会议资料',
      qualityWeight: { score: 1 },
    },
  });
  const ticketVip = await prisma.ticketType.upsert({
    where: { id: uuidv4() },
    update: {},
    create: {
      name: 'VIP 贵宾票',
      level: 'vip',
      price: 4999,
      totalInventory: 100,
      warningThreshold: 10,
      isOnSale: true,
      description: 'VIP 前排座位、VIP 休息室、贵宾晚宴、一对一交流机会',
      qualityWeight: { score: 2 },
    },
  });
  const ticketGuest = await prisma.ticketType.upsert({
    where: { id: uuidv4() },
    update: {},
    create: {
      name: '嘉宾专属票',
      level: 'guest',
      price: 0,
      totalInventory: 50,
      warningThreshold: 5,
      isOnSale: false,
      description: '定向邀约嘉宾专属，免费',
      qualityWeight: { score: 3 },
    },
  });
  console.log('✅ 票种创建成功');

  const sessions = [
    {
      name: '主论坛·第一天上午',
      startTime: new Date('2026-09-15T09:00:00'),
      endTime: new Date('2026-09-15T12:00:00'),
      venue: '国际会议中心A厅',
      capacity: 650,
      qualityWeight: 1.2,
    },
    {
      name: '主论坛·第一天下午',
      startTime: new Date('2026-09-15T14:00:00'),
      endTime: new Date('2026-09-15T17:30:00'),
      venue: '国际会议中心A厅',
      capacity: 650,
      qualityWeight: 1.2,
    },
    {
      name: '分论坛·AI 创新专场',
      startTime: new Date('2026-09-16T09:00:00'),
      endTime: new Date('2026-09-16T12:00:00'),
      venue: 'B1分会场',
      capacity: 200,
      qualityWeight: 1.0,
    },
  ];
  const createdSessions = [];
  for (const s of sessions) {
    const session = await prisma.session.upsert({
      where: { id: uuidv4() },
      update: {},
      create: s,
    });
    createdSessions.push(session);
    const zones = ['A', 'B', 'C'];
    for (const zone of zones) {
      for (let row = 1; row <= 5; row++) {
        for (let num = 1; num <= 10; num++) {
          await prisma.seat.create({
            data: {
              sessionId: session.id,
              row: `R${row}`,
              number: String(num).padStart(2, '0'),
              zone,
              status: 'available',
            },
          });
        }
      }
    }
  }
  console.log('✅ 场次和座位创建成功');

  const guestData = [
    { name: '张一鸣', company: '字节跳动', totalQuota: 5, priorityLevel: 1 },
    { name: '李彦宏', company: '百度', totalQuota: 4, priorityLevel: 1 },
    { name: '李开复', company: '创新工场', totalQuota: 3, priorityLevel: 2 },
    { name: '沈南鹏', company: '红杉资本', totalQuota: 3, priorityLevel: 2 },
    { name: '田源', company: '投资机构', totalQuota: 2, priorityLevel: 3 },
  ];
  for (const g of guestData) {
    await prisma.guest.upsert({
      where: { id: uuidv4() },
      update: {},
      create: g,
    });
  }
  console.log('✅ 嘉宾创建成功');

  const templates = [
    {
      code: 'review_approved', name: '审核通过通知', type: 'email', subject: '【峰会报名】您的报名已审核通过',
      contentBody: '<p>尊敬的 {{name}}，您报名的「{{summitName}}」审核已通过，请凭签到码入场。</p><p>签到码：{{checkinCode}}</p>',
      variables: ['name', 'summitName', 'checkinCode'] },
    {
      code: 'review_rejected', name: '审核未通过通知', type: 'email', subject: '【峰会报名】您的报名未通过审核',
      contentBody: '<p>尊敬的 {{name}}，很抱歉您的报名未通过审核。原因：{{reason}}</p>',
      variables: ['name', 'reason'] },
    {
      code: 'refund_completed', name: '退款完成通知', type: 'email', subject: '【峰会报名】退款已完成',
      contentBody: '<p>尊敬的 {{name}}，您的退款申请已处理，退款金额 ¥{{amount}} 将于 1-3 个工作日原路返回。</p>',
      variables: ['name', 'amount'] },
    {
      code: 'gap_reminder', name: '到场确认提醒', type: 'email', subject: '【峰会报名】请确认您的到场意向',
      contentBody: '<p>尊敬的 {{name}}，峰会即将开始，请点击链接确认是否到场：{{confirmLink}}</p>',
      variables: ['name', 'confirmLink'] },
  ];
  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: {
        code: t.code,
        name: t.name,
        type: t.type,
        subject: t.subject,
        contentBody: t.contentBody,
        variables: t.variables,
      },
    });
  }
  console.log('✅ 通知模板创建成功');

  const mockUsers = [
    { name: '李明', phone: '13800138001', email: 'liming@techcorp.com', company: '科技创新有限公司', title: 'CEO', channelSource: '官方网站' },
    { name: '王芳', phone: '13800138002', email: 'wangfang@ai-startup.cn', company: '智启AI', title: 'CTO', channelSource: '合作伙伴推荐' },
    { name: '张伟', phone: '13800138003', email: 'zhangwei@bigdata.io', company: '数聚科技', title: 'VP of Engineering', channelSource: '微信推广' },
    { name: '刘洋', phone: '13800138004', email: 'liuyang@vc-fund.com', company: '远见资本', title: '投资总监', channelSource: '行业媒体' },
    { name: '陈静', phone: '13800138005', email: 'chenjing@cloudservice.com', company: '云服务集团', title: '产品总监', channelSource: '官方网站' },
    { name: '赵强', phone: '13800138006', email: 'zhaoqiang@fintech.com', company: '新金融科技', title: '首席架构师', channelSource: '地推活动' },
    { name: '孙丽', phone: '13800138007', email: 'sunli@ecommerce.cn', company: '新零售电商', title: '技术负责人', channelSource: '合作伙伴推荐' },
    { name: '周杰', phone: '13800138008', email: 'zhoujie@game-studio.com', company: '互娱工作室', title: '创始人', channelSource: '微信推广' },
    { name: '吴敏', phone: '13800138009', email: 'wumin@biotech.com', company: '生物科技研究院', title: '研究院院长', channelSource: '行业媒体' },
    { name: '郑浩', phone: '13800138010', email: 'zhenghao@auto-ai.cn', company: '智驾科技', title: '算法总监', channelSource: '官方网站' },
    { name: '冯雪', phone: '13800138011', email: 'fengxue@edutech.com', company: '智慧教育', title: 'COO', channelSource: '合作伙伴推荐' },
    { name: '何磊', phone: '13800138012', email: 'helei@robotics.io', company: '未来机器人', title: '联合创始人', channelSource: '微信推广' },
  ];

  const statuses: any[] = ['pending', 'reviewing', 'approved', 'approved', 'approved', 'paid', 'paid', 'checked_in', 'rejected', 'closed', 'pending', 'reviewing'];
  const tickets = [ticketNormal.id, ticketVip.id, ticketNormal.id, ticketVip.id, ticketGuest.id, ticketNormal.id, ticketVip.id, ticketNormal.id, ticketNormal.id, ticketVip.id, ticketNormal.id, ticketNormal.id];

  for (let i = 0; i < mockUsers.length; i++) {
    const u = mockUsers[i];
    const user = await prisma.user.create({ data: u });
    const ticketTypeId = tickets[i];
    const ticket = i < 3 ? createdSessions[0] : i < 7 ? createdSessions[1] : createdSessions[2];
    const sessionId = ticket.id;
    const amount = (i === 4 || i === 7) ? 0 : (i % 2 === 0 ? 1999 : 4999);
    const reg = await prisma.registration.create({
      data: {
        orderNo: `SUM2026${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        ticketTypeId,
        sessionId,
        status: statuses[i],
        amount,
        qualityScore: Math.floor(Math.random() * 40) + 60,
      },
    });

    if (statuses[i] === 'approved' || statuses[i] === 'paid' || statuses[i] === 'checked_in') {
      const code = 'CHK' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await prisma.checkinCode.create({
        data: {
          registrationId: reg.id,
          code,
          qrSvg: `<svg>${code}</svg>`,
          isUsed: statuses[i] === 'checked_in',
          usedAt: statuses[i] === 'checked_in' ? new Date() : null,
          usedLocation: statuses[i] === 'checked_in' ? '主会场入口' : null,
        },
      });
    }

    if (statuses[i] === 'closed') {
      const reasons = await prisma.closeReason.findMany({ take: 1 });
      await prisma.closeException.create({
        data: {
          registrationId: reg.id,
          closeReasonId: reasons[0].id,
          note: '模拟数据：参会者资料不完整，多次联系未果',
        },
      });
    }

    await prisma.qualityMetric.create({
      data: {
        registrationId: reg.id,
        channelScore: Math.floor(Math.random() * 30) + 70,
        companyScore: Math.floor(Math.random() * 30) + 70,
        positionScore: Math.floor(Math.random() * 30) + 70,
        paymentSpeedScore: Math.floor(Math.random() * 30) + 70,
        totalScore: Math.floor(Math.random() * 40) + 60,
        detailsJson: JSON.stringify({ autoEvaluated: true }),
      },
    });
  }

  await prisma.refund.create({
    data: {
      refundNo: 'RF202600001',
      registrationId: (await prisma.registration.findFirst({ where: { status: 'rejected' as any } }))?.id || '',
      userId: (await prisma.user.findFirst({ where: { phone: '13800138009' } }))?.id || '',
      amount: 1999,
      reason: '行程冲突',
      note: '用户因临时出差无法参加',
      status: 'pending' as any,
    },
  });

  const gapStatuses = ['approved', 'paid'];
  const gapRegs = await prisma.registration.findMany({
    where: { status: { in: gapStatuses as any }, checkinCode: { isNot: null } },
    take: 3,
  });
  for (const reg of gapRegs) {
    await prisma.gapTodo.create({
      data: {
        registrationId: reg.id,
        gapType: 'unconfirmed',
        priority: Math.floor(Math.random() * 3) + 1,
        status: 'pending',
      },
    });
  }

  console.log('✅ 模拟报名数据创建成功 (12条)');
  console.log('🎉 所有初始化完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
