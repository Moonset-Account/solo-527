const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: hashedPassword,
      name: '前台员工',
      role: 'staff',
      status: 'active',
    },
  });

  const consultants = await Promise.all([
    prisma.consultant.upsert({
      where: { id: 1 },
      update: {},
      create: { name: '李美容师', phone: '13800000001', level: '高级', commissionRate: 15, status: 'active' },
    }),
    prisma.consultant.upsert({
      where: { id: 2 },
      update: {},
      create: { name: '王顾问', phone: '13800000002', level: '中级', commissionRate: 12, status: 'active' },
    }),
    prisma.consultant.upsert({
      where: { id: 3 },
      update: {},
      create: { name: '张技师', phone: '13800000003', level: '初级', commissionRate: 10, status: 'active' },
    }),
  ]);

  const treatments = await Promise.all([
    prisma.treatment.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '水光针护理',
        category: '皮肤护理',
        price: 1280,
        duration: 60,
        description: '深层补水，改善肌肤干燥',
        totalSessions: 10,
        validDays: 365,
        status: 'active',
        sortOrder: 1,
      },
    }),
    prisma.treatment.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '面部抗衰老',
        category: '皮肤护理',
        price: 2680,
        duration: 90,
        description: '紧致肌肤，减少细纹',
        totalSessions: 8,
        validDays: 365,
        status: 'active',
        sortOrder: 2,
      },
    }),
    prisma.treatment.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '肩颈按摩',
        category: '身体护理',
        price: 380,
        duration: 45,
        description: '舒缓肩颈疲劳',
        totalSessions: 12,
        validDays: 180,
        status: 'active',
        sortOrder: 3,
      },
    }),
    prisma.treatment.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '精油SPA',
        category: '身体护理',
        price: 680,
        duration: 90,
        description: '全身放松，精油护理',
        totalSessions: 10,
        validDays: 180,
        status: 'active',
        sortOrder: 4,
      },
    }),
    prisma.treatment.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: '美甲套餐',
        category: '美甲',
        price: 198,
        duration: 60,
        description: '基础护理+款式',
        totalSessions: 5,
        validDays: 90,
        status: 'active',
        sortOrder: 5,
      },
    }),
  ]);

  const members = await Promise.all([
    prisma.member.upsert({
      where: { phone: '13900000001' },
      update: {},
      create: {
        memberNo: 'M20240001',
        name: '陈美丽',
        phone: '13900000001',
        gender: 'female',
        level: 'VIP',
        totalSpent: 12800,
        points: 1280,
        status: 'active',
        lastVisitAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.member.upsert({
      where: { phone: '13900000002' },
      update: {},
      create: {
        memberNo: 'M20240002',
        name: '林小芳',
        phone: '13900000002',
        gender: 'female',
        level: '普通',
        totalSpent: 3200,
        points: 320,
        status: 'active',
        lastVisitAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.member.upsert({
      where: { phone: '13900000003' },
      update: {},
      create: {
        memberNo: 'M20240003',
        name: '王女士',
        phone: '13900000003',
        gender: 'female',
        level: '金卡',
        totalSpent: 25600,
        points: 2560,
        status: 'active',
        lastVisitAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.member.upsert({
      where: { phone: '13900000004' },
      update: {},
      create: {
        memberNo: 'M20240004',
        name: '赵女士',
        phone: '13900000004',
        gender: 'female',
        level: '普通',
        totalSpent: 580,
        points: 58,
        status: 'active',
        lastVisitAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  await prisma.memberTreatment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      memberId: members[0].id,
      treatmentId: treatments[0].id,
      totalSessions: 10,
      usedSessions: 3,
      remainingSessions: 7,
      purchasePrice: 12800,
      purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expireDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      consultantId: consultants[0].id,
      status: 'active',
    },
  });

  await prisma.memberTreatment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      memberId: members[0].id,
      treatmentId: treatments[2].id,
      totalSessions: 12,
      usedSessions: 10,
      remainingSessions: 2,
      purchasePrice: 4560,
      purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      expireDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      consultantId: consultants[1].id,
      status: 'active',
    },
  });

  await prisma.memberTreatment.upsert({
    where: { id: 3 },
    update: {},
    create: {
      memberId: members[2].id,
      treatmentId: treatments[1].id,
      totalSessions: 8,
      usedSessions: 1,
      remainingSessions: 7,
      purchasePrice: 21440,
      purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expireDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
      consultantId: consultants[0].id,
      status: 'active',
    },
  });

  await prisma.memberTreatment.upsert({
    where: { id: 4 },
    update: {},
    create: {
      memberId: members[1].id,
      treatmentId: treatments[4].id,
      totalSessions: 5,
      usedSessions: 4,
      remainingSessions: 1,
      purchasePrice: 990,
      purchaseDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      expireDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      consultantId: consultants[2].id,
      status: 'active',
    },
  });

  await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU001' },
      update: {},
      create: {
        name: '玻尿酸精华液',
        category: '护肤产品',
        sku: 'SKU001',
        unit: '瓶',
        price: 398,
        cost: 180,
        stock: 45,
        minStock: 10,
        maxStock: 100,
        status: 'active',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU002' },
      update: {},
      create: {
        name: '修复面膜',
        category: '护肤产品',
        sku: 'SKU002',
        unit: '盒',
        price: 268,
        cost: 120,
        stock: 5,
        minStock: 20,
        maxStock: 100,
        status: 'active',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU003' },
      update: {},
      create: {
        name: '按摩精油',
        category: '身体护理',
        sku: 'SKU003',
        unit: '瓶',
        price: 168,
        cost: 75,
        stock: 30,
        minStock: 10,
        maxStock: 50,
        status: 'active',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU004' },
      update: {},
      create: {
        name: '美甲油胶',
        category: '美甲产品',
        sku: 'SKU004',
        unit: '瓶',
        price: 88,
        cost: 35,
        stock: 80,
        minStock: 30,
        maxStock: 150,
        status: 'active',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU005' },
      update: {},
      create: {
        name: '洗面奶',
        category: '护肤产品',
        sku: 'SKU005',
        unit: '支',
        price: 128,
        cost: 55,
        stock: 3,
        minStock: 15,
        maxStock: 60,
        status: 'active',
      },
    }),
  ]);

  await Promise.all([
    prisma.reminderRule.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '疗程即将到期-紧急',
        type: 'treatment_expire',
        daysBefore: 3,
        urgencyLevel: 'urgent',
        template: '您的{treatment}疗程还剩{days}天到期，剩余{remaining}次，请尽快使用',
        isEnabled: true,
        sortOrder: 1,
      },
    }),
    prisma.reminderRule.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '疗程即将到期-普通',
        type: 'treatment_expire',
        daysBefore: 7,
        urgencyLevel: 'normal',
        template: '您的{treatment}疗程还有{days}天到期，请安排时间到店',
        isEnabled: true,
        sortOrder: 2,
      },
    }),
    prisma.reminderRule.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '疗程即将到期-提醒',
        type: 'treatment_expire',
        daysBefore: 30,
        urgencyLevel: 'low',
        template: '温馨提醒：您的{treatment}疗程还有{days}天到期',
        isEnabled: true,
        sortOrder: 3,
      },
    }),
    prisma.reminderRule.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '会员久未到店',
        type: 'member_inactive',
        daysBefore: 30,
        urgencyLevel: 'normal',
        template: '亲爱的{name}，您已经{days}天没来了，我们想念您！',
        isEnabled: true,
        sortOrder: 4,
      },
    }),
  ]);

  const reminderRules = await prisma.reminderRule.findMany();

  await prisma.reminder.upsert({
    where: { id: 1 },
    update: {},
    create: {
      memberId: members[0].id,
      ruleId: reminderRules[0]?.id,
      type: 'treatment_expire',
      title: '疗程即将到期',
      content: '您的肩颈按摩疗程还剩5天到期，剩余2次，请尽快使用',
      urgencyLevel: 'urgent',
      status: 'pending',
    },
  });

  await prisma.reminder.upsert({
    where: { id: 2 },
    update: {},
    create: {
      memberId: members[1].id,
      ruleId: reminderRules[0]?.id,
      type: 'treatment_expire',
      title: '疗程即将到期',
      content: '您的美甲套餐还剩2天到期，剩余1次，请尽快使用',
      urgencyLevel: 'urgent',
      status: 'pending',
    },
  });

  await prisma.reminder.upsert({
    where: { id: 3 },
    update: {},
    create: {
      memberId: members[3].id,
      ruleId: reminderRules[3]?.id,
      type: 'member_inactive',
      title: '会员久未到店',
      content: '亲爱的赵女士，您已经60天没来了，我们为您准备了专属优惠',
      urgencyLevel: 'normal',
      status: 'pending',
    },
  });

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrow2 = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow2.setHours(14, 0, 0, 0);

  await Promise.all([
    prisma.appointment.upsert({
      where: { id: 1 },
      update: {},
      create: {
        memberId: members[0].id,
        consultantId: consultants[0].id,
        appointmentDate: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmed',
        totalAmount: 380,
        remark: '老顾客，按上次方案',
      },
    }),
    prisma.appointment.upsert({
      where: { id: 2 },
      update: {},
      create: {
        memberId: members[2].id,
        consultantId: consultants[1].id,
        appointmentDate: tomorrow,
        startTime: '10:00',
        endTime: '11:30',
        status: 'pending',
        totalAmount: 2680,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 3 },
      update: {},
      create: {
        memberId: members[1].id,
        consultantId: consultants[2].id,
        appointmentDate: tomorrow2,
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        totalAmount: 198,
      },
    }),
  ]);

  const products = await prisma.product.findMany();
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });

  await prisma.damageReport.upsert({
    where: { id: 1 },
    update: {},
    create: {
      productId: products[1]?.id || products[0]?.id,
      quantity: 2,
      reason: '包装盒破损，产品外漏',
      reporterId: adminUser?.id || 1,
      status: 'pending',
    },
  });

  await prisma.damageReport.upsert({
    where: { id: 2 },
    update: {},
    create: {
      productId: products[4]?.id || products[0]?.id,
      quantity: 1,
      reason: '过期产品',
      reporterId: adminUser?.id || 1,
      status: 'approved',
      approverId: adminUser?.id || 1,
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await Promise.all([
    prisma.commission.upsert({
      where: { id: 1 },
      update: {},
      create: {
        consultantId: consultants[0].id,
        memberId: members[0].id,
        treatmentId: treatments[0].id,
        amount: 1920,
        type: 'treatment',
        status: 'settled',
        settleDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        remark: '水光针护理提成',
      },
    }),
    prisma.commission.upsert({
      where: { id: 2 },
      update: {},
      create: {
        consultantId: consultants[1].id,
        memberId: members[0].id,
        treatmentId: treatments[2].id,
        amount: 547.2,
        type: 'treatment',
        status: 'pending',
        remark: '肩颈按摩提成',
      },
    }),
    prisma.commission.upsert({
      where: { id: 3 },
      update: {},
      create: {
        consultantId: consultants[0].id,
        memberId: members[2].id,
        treatmentId: treatments[1].id,
        amount: 3216,
        type: 'treatment',
        status: 'pending',
        remark: '面部抗衰老提成',
      },
    }),
  ]);

  const sampleImage = 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400';
  await Promise.all([
    prisma.portfolioItem.upsert({
      where: { id: 1 },
      update: {},
      create: {
        memberId: members[0].id,
        treatmentId: treatments[0].id,
        title: '水光针护理效果对比',
        description: '连续3次护理后，肌肤水润度明显提升',
        image: sampleImage,
        beforeImage: sampleImage,
        afterImage: sampleImage,
        status: 'active',
      },
    }),
    prisma.portfolioItem.upsert({
      where: { id: 2 },
      update: {},
      create: {
        memberId: members[2].id,
        treatmentId: treatments[1].id,
        title: '面部抗衰紧致',
        description: '1次护理后，下颌线紧致提升',
        image: sampleImage,
        status: 'active',
      },
    }),
    prisma.portfolioItem.upsert({
      where: { id: 3 },
      update: {},
      create: {
        memberId: members[1].id,
        treatmentId: treatments[4].id,
        title: '美甲款式展示',
        description: '法式美甲款式',
        image: sampleImage,
        status: 'active',
      },
    }),
  ]);

  console.log('✅ 种子数据创建完成！');
  console.log('默认账号: admin / 123456');
  console.log('员工账号: staff / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
