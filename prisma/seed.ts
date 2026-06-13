import { PrismaClient, UserRole, LeadQuality, LeadStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据...");

  // 1. 用户
  const admin = await prisma.user.upsert({
    where: { clerkId: "mock-admin-user" },
    update: {},
    create: {
      clerkId: "mock-admin-user",
      email: "admin@dental-clinic.dev",
      name: "王管理",
      role: UserRole.ADMIN,
      phone: "13800000001",
    },
  });

  const manager = await prisma.user.upsert({
    where: { clerkId: "manager-001" },
    update: {},
    create: {
      clerkId: "manager-001",
      email: "zhang@dental-clinic.dev",
      name: "张经理",
      role: UserRole.MANAGER,
      phone: "13800000002",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { clerkId: "receptionist-001" },
    update: {},
    create: {
      clerkId: "receptionist-001",
      email: "li@dental-clinic.dev",
      name: "李前台",
      role: UserRole.RECEPTIONIST,
      phone: "13800000003",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { clerkId: "doctor-001" },
    update: {},
    create: {
      clerkId: "doctor-001",
      email: "zhao@dental-clinic.dev",
      name: "赵医生",
      role: UserRole.DOCTOR,
      phone: "13800000004",
    },
  });

  console.log(`  ✅ 用户: ${[admin, manager, receptionist, doctor].map((u) => u.name).join(", ")}`);

  // 2. 客户标签
  const tags = await Promise.all([
    prisma.customerTag.create({ data: { name: "种植牙", color: "#059669", sort: 1 } }),
    prisma.customerTag.create({ data: { name: "正畸", color: "#7c3aed", sort: 2 } }),
    prisma.customerTag.create({ data: { name: "美白", color: "#f59e0b", sort: 3 } }),
    prisma.customerTag.create({ data: { name: "修复", color: "#dc2626", sort: 4 } }),
    prisma.customerTag.create({ data: { name: "儿童齿科", color: "#0ea5e9", sort: 5 } }),
    prisma.customerTag.create({ data: { name: "VIP", color: "#be185d", sort: 0 } }),
  ]);

  console.log(`  ✅ 标签: ${tags.map((t) => t.name).join(", ")}`);

  // 3. 客户
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "陈先生",
        phone: "13912345678",
        gender: "MALE",
        age: 40,
        source: "线上推广",
        remark: "对种植牙方案较感兴趣，预算充裕",
        tags: { create: [{ tagId: tags[0].id }, { tagId: tags[5].id }] },
      },
    }),
    prisma.customer.create({
      data: {
        name: "刘女士",
        phone: "13923456789",
        gender: "FEMALE",
        age: 34,
        source: "老客推荐",
        remark: "想做隐形正畸，已咨询两家竞品",
        tags: { create: [{ tagId: tags[1].id }, { tagId: tags[5].id }] },
      },
    }),
    prisma.customer.create({
      data: {
        name: "张同学",
        phone: "13934567890",
        gender: "MALE",
        age: 23,
        source: "美团",
        remark: "学生，关注价格",
        tags: { create: [{ tagId: tags[1].id }] },
      },
    }),
    prisma.customer.create({
      data: {
        name: "王阿姨",
        phone: "13945678901",
        gender: "FEMALE",
        age: 65,
        source: "社区义诊",
        remark: "活动义齿修复需求",
        tags: { create: [{ tagId: tags[3].id }] },
      },
    }),
    prisma.customer.create({
      data: {
        name: "李女士",
        phone: "13956789012",
        gender: "FEMALE",
        age: 38,
        source: "小红书",
        remark: "冷光美白咨询",
        tags: { create: [{ tagId: tags[2].id }] },
      },
    }),
    prisma.customer.create({
      data: {
        name: "赵小宝",
        phone: "13967890123",
        gender: "MALE",
        age: 8,
        source: "社区义诊",
        remark: "窝沟封闭+涂氟，家长赵先生",
        tags: { create: [{ tagId: tags[4].id }] },
      },
    }),
  ]);

  console.log(`  ✅ 客户: ${customers.map((c) => c.name).join(", ")}`);

  // 4. 跟进阶段
  const stages = await Promise.all([
    prisma.followUpStage.create({ data: { name: "初次咨询", sort: 1, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "方案推荐", sort: 2, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "报价沟通", sort: 3, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "犹豫考虑", sort: 4, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "确定签约", sort: 5, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "已成交", sort: 6, isActive: true } }),
    prisma.followUpStage.create({ data: { name: "已流失", sort: 7, isActive: false } }),
  ]);

  console.log(`  ✅ 阶段: ${stages.map((s) => s.name).join(" → ")}`);

  // 5. 咨询记录
  const records = await Promise.all([
    prisma.consultationRecord.create({
      data: {
        customerId: customers[0].id,
        consultationDate: new Date("2026-06-01"),
        chiefComplaint: "右上后牙缺失3个月，影响咀嚼",
        dentalHistory: "3个月前拔除右上第一磨牙，无其他系统性疾病",
        diagnosis: "右上第一磨牙缺失",
        treatmentPlan: "种植修复方案：ITI种植体+全瓷冠，预计费用18000元",
        estimatedFee: 18000,
        intentionLevel: "HIGH",
        intentionItems: { items: ["种植体选择", "手术时间", "费用分期"] },
        createdById: receptionist.id,
      },
    }),
    prisma.consultationRecord.create({
      data: {
        customerId: customers[1].id,
        consultationDate: new Date("2026-06-03"),
        chiefComplaint: "牙齿不整齐，想矫正",
        dentalHistory: "无正畸史，智齿已拔",
        diagnosis: "牙列拥挤",
        treatmentPlan: "隐形矫正方案，预计周期18个月",
        estimatedFee: 32000,
        intentionLevel: "HIGH",
        intentionItems: { items: ["隐形 vs 金属", "价格比较", "时间安排"] },
        createdById: receptionist.id,
      },
    }),
    prisma.consultationRecord.create({
      data: {
        customerId: customers[2].id,
        consultationDate: new Date("2026-06-05"),
        chiefComplaint: "门牙外凸，同学笑话",
        dentalHistory: "无",
        diagnosis: "前牙前突",
        treatmentPlan: "金属自锁矫正，预计周期12个月",
        estimatedFee: 12000,
        intentionLevel: "MEDIUM",
        intentionItems: { items: ["价格优惠", "复诊频率"] },
        createdById: receptionist.id,
      },
    }),
    prisma.consultationRecord.create({
      data: {
        customerId: customers[3].id,
        consultationDate: new Date("2026-06-07"),
        chiefComplaint: "下颌多颗牙缺失，吃饭困难",
        dentalHistory: "高血压服药中，有糖尿病史",
        diagnosis: "下颌多颗牙缺失",
        treatmentPlan: "活动义齿修复，待血压稳定后考虑种植",
        estimatedFee: 4500,
        intentionLevel: "LOW",
        createdById: doctor.id,
      },
    }),
  ]);

  console.log(`  ✅ 咨询记录: ${records.length} 条`);

  // 6. 线索
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        customerId: customers[0].id,
        recordId: records[0].id,
        title: "陈先生-种植牙意向",
        description: "右上磨牙种植，预算1.8万，意向强",
        quality: LeadQuality.HIGH,
        status: LeadStatus.CONTACTING,
        estimatedAmount: 18000,
        assignedToId: doctor.id,
        createdById: receptionist.id,
        stageId: stages[2].id,
        followUpCount: 3,
        lastFollowAt: new Date("2026-06-10"),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[1].id,
        recordId: records[1].id,
        title: "刘女士-隐形正畸",
        description: "对比竞品中，预算3.2万",
        quality: LeadQuality.HIGH,
        status: LeadStatus.APPOINTED,
        estimatedAmount: 32000,
        assignedToId: manager.id,
        createdById: receptionist.id,
        stageId: stages[3].id,
        followUpCount: 5,
        lastFollowAt: new Date("2026-06-09"),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[2].id,
        recordId: records[2].id,
        title: "张同学-正畸咨询",
        description: "学生优惠，关注价格",
        quality: LeadQuality.MEDIUM,
        status: LeadStatus.CONTACTING,
        estimatedAmount: 12000,
        assignedToId: receptionist.id,
        createdById: receptionist.id,
        stageId: stages[1].id,
        followUpCount: 2,
        lastFollowAt: new Date("2026-06-08"),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[3].id,
        recordId: records[3].id,
        title: "王阿姨-义齿修复",
        description: "活动义齿修复需求，预算低",
        quality: LeadQuality.LOW,
        status: LeadStatus.CONTACTING,
        estimatedAmount: 4500,
        assignedToId: doctor.id,
        createdById: doctor.id,
        stageId: stages[1].id,
        followUpCount: 1,
        lastFollowAt: new Date("2026-06-07"),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[4].id,
        title: "李女士-美白咨询",
        description: "冷光美白咨询，意向中等",
        quality: LeadQuality.MEDIUM,
        status: LeadStatus.NEW,
        estimatedAmount: 3000,
        assignedToId: receptionist.id,
        createdById: receptionist.id,
        stageId: stages[0].id,
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[5].id,
        title: "赵小宝-儿童齿科",
        description: "窝沟封闭+涂氟，家长咨询",
        quality: LeadQuality.POTENTIAL,
        status: LeadStatus.NEW,
        assignedToId: doctor.id,
        createdById: receptionist.id,
        stageId: stages[0].id,
        isAnomaly: false,
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[0].id,
        title: "陈先生-美白追加咨询",
        description: "种植牙之外还想做美白",
        quality: LeadQuality.LOW,
        status: LeadStatus.SUSPENDED,
        estimatedAmount: 3000,
        assignedToId: receptionist.id,
        createdById: receptionist.id,
        stageId: stages[6].id,
        isAnomaly: true,
      },
    }),
  ]);

  console.log(`  ✅ 线索: ${leads.length} 条`);

  // 7. 回访规则
  const rules = await Promise.all([
    prisma.followUpRule.create({
      data: {
        name: "初次咨询后24小时回访",
        description: "初次咨询后1天内电话回访确认意向",
        triggerStageId: stages[0].id,
        triggerCondition: { event: "first_consultation" },
        method: "PHONE",
        intervalHours: 24,
        templateContent: "您好，感谢您到店咨询，请问还有哪些疑问需要解答？",
        priority: 10,
      },
    }),
    prisma.followUpRule.create({
      data: {
        name: "方案推荐后3天微信跟进",
        description: "方案推荐后3天微信推送优惠活动",
        triggerStageId: stages[1].id,
        triggerCondition: { event: "plan_recommended" },
        method: "WECHAT",
        intervalHours: 72,
        templateContent: "您好，我们本周有正畸优惠活动，详情可咨询前台~",
        priority: 5,
      },
    }),
    prisma.followUpRule.create({
      data: {
        name: "报价后7天电话确认",
        description: "报价后7天电话确认决策进度",
        triggerStageId: stages[2].id,
        triggerCondition: { event: "price_quoted" },
        method: "PHONE",
        intervalHours: 168,
        templateContent: "您好，请问方案考虑得如何？如有任何疑问随时联系我们。",
        priority: 8,
      },
    }),
  ]);

  console.log(`  ✅ 回访规则: ${rules.length} 条`);

  // 8. 回访计划
  const now = new Date();
  const plans = await Promise.all([
    prisma.followUpPlan.create({
      data: {
        leadId: leads[0].id,
        planDate: new Date(now.getTime() + 24 * 3600 * 1000),
        method: "PHONE",
        content: "确认种植体选择，沟通手术排期",
        createdById: manager.id,
      },
    }),
    prisma.followUpPlan.create({
      data: {
        leadId: leads[1].id,
        planDate: new Date(now.getTime() + 48 * 3600 * 1000),
        method: "WECHAT",
        content: "推送隐形正畸夏季优惠活动",
        createdById: manager.id,
      },
    }),
    prisma.followUpPlan.create({
      data: {
        leadId: leads[2].id,
        planDate: new Date(now.getTime() - 24 * 3600 * 1000),
        method: "PHONE",
        content: "跟进学生优惠方案接受度",
        isCompleted: true,
        completedAt: new Date(now.getTime() - 24 * 3600 * 1000),
        result: "家长表示考虑中，需要再等一周",
        createdById: receptionist.id,
      },
    }),
    prisma.followUpPlan.create({
      data: {
        leadId: leads[0].id,
        planDate: new Date(now.getTime() - 72 * 3600 * 1000),
        method: "PHONE",
        content: "回访种植牙方案反馈",
        isCompleted: true,
        completedAt: new Date(now.getTime() - 72 * 3600 * 1000),
        result: "患者满意方案，准备预约手术",
        createdById: manager.id,
      },
    }),
    prisma.followUpPlan.create({
      data: {
        leadId: leads[3].id,
        planDate: new Date(now.getTime() + 72 * 3600 * 1000),
        method: "VISIT",
        content: "邀约到院做口腔检查",
        createdById: doctor.id,
      },
    }),
    prisma.followUpPlan.create({
      data: {
        leadId: leads[4].id,
        planDate: new Date(now.getTime() + 24 * 3600 * 1000),
        method: "SMS",
        content: "发送美白项目介绍短信",
        createdById: receptionist.id,
      },
    }),
  ]);

  console.log(`  ✅ 回访计划: ${plans.length} 条`);

  // 9. 回款记录
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        customerId: customers[0].id,
        leadId: leads[0].id,
        itemName: "ITI种植体+全瓷冠",
        totalAmount: 18000,
        paidAmount: 10000,
        status: PaymentStatus.PARTIAL,
        dueDate: new Date("2026-07-01"),
        paymentMethod: "微信支付",
        remark: "首付1万，余款术后付清",
        createdById: manager.id,
      },
    }),
    prisma.payment.create({
      data: {
        customerId: customers[1].id,
        leadId: leads[1].id,
        itemName: "隐形正畸全套",
        totalAmount: 32000,
        paidAmount: 0,
        status: PaymentStatus.UNPAID,
        dueDate: new Date("2026-06-20"),
        remark: "等待签约确认",
        createdById: manager.id,
      },
    }),
    prisma.payment.create({
      data: {
        customerId: customers[2].id,
        leadId: leads[2].id,
        itemName: "金属自锁矫正",
        totalAmount: 12000,
        paidAmount: 6000,
        status: PaymentStatus.PARTIAL,
        dueDate: new Date("2026-06-30"),
        paymentMethod: "支付宝",
        remark: "学生优惠价，首付50%",
        createdById: receptionist.id,
      },
    }),
    prisma.payment.create({
      data: {
        customerId: customers[3].id,
        leadId: leads[3].id,
        itemName: "活动义齿修复",
        totalAmount: 4500,
        paidAmount: 4500,
        status: PaymentStatus.PAID,
        paidDate: new Date("2026-06-08"),
        paymentMethod: "现金",
        createdById: doctor.id,
      },
    }),
  ]);

  console.log(`  ✅ 回款记录: ${payments.length} 条`);

  // 10. 异常记录
  const abnormals = await Promise.all([
    prisma.abnormalRecord.create({
      data: {
        leadId: leads[6].id,
        customerId: customers[0].id,
        title: "线索撞单-陈先生美白需求",
        type: "DUPLICATE_LEAD",
        severity: "NORMAL",
        status: "RESOLVED",
        description: "陈先生种植牙线索已有，美白需求创建了重复线索",
        duplicateReason: "前台录入时未检索已有客户",
        responseNode: "INITIAL_CONTACT",
        reporterId: manager.id,
        handlerId: manager.id,
        handledAt: new Date("2026-06-10"),
        handleNote: "合并线索到主线索，关闭重复项",
      },
    }),
    prisma.abnormalRecord.create({
      data: {
        leadId: leads[1].id,
        customerId: customers[1].id,
        title: "超时未跟进-刘女士正畸",
        type: "NO_RESPONSE",
        severity: "HIGH",
        status: "PROCESSING",
        description: "刘女士隐形正畸线索已超5天未跟进",
        duplicateReason: "经理出差，未及时安排回访",
        responseNode: "FIRST_FOLLOWUP",
        reporterId: admin.id,
        handlerId: manager.id,
      },
    }),
    prisma.abnormalRecord.create({
      data: {
        leadId: leads[3].id,
        customerId: customers[3].id,
        title: "线索质量下降-王阿姨义齿",
        type: "OTHER",
        severity: "NORMAL",
        status: "PENDING",
        description: "王阿姨义齿修复线索意向转弱，预算有限",
        duplicateReason: "竞品价格更低",
        responseNode: "TREATMENT_FOLLOWUP",
        reporterId: doctor.id,
      },
    }),
  ]);

  console.log(`  ✅ 异常记录: ${abnormals.length} 条`);

  // 11. 线索撞单记录
  await prisma.leadDuplicate.create({
    data: {
      leadId: leads[0].id,
      duplicateLeadId: leads[6].id,
      reason: "同一客户不同项目创建重复线索",
      detectedById: manager.id,
      isResolved: true,
      mergedAt: new Date("2026-06-10"),
    },
  });

  // 12. 操作日志
  await Promise.all([
    prisma.operationLog.create({
      data: {
        entityType: "Lead",
        entityId: leads[0].id,
        action: "CREATE",
        detail: "创建线索: 陈先生-种植牙意向",
        operatorId: receptionist.id,
      },
    }),
    prisma.operationLog.create({
      data: {
        entityType: "Lead",
        entityId: leads[0].id,
        fieldName: "status",
        oldValue: "NEW",
        newValue: "CONTACTING",
        action: "UPDATE",
        detail: "线索状态变更为「联系中」",
        operatorId: doctor.id,
      },
    }),
    prisma.operationLog.create({
      data: {
        entityType: "Lead",
        entityId: leads[1].id,
        fieldName: "assignedToId",
        oldValue: receptionist.id,
        newValue: manager.id,
        action: "UPDATE",
        detail: "将刘女士线索分配给张经理",
        operatorId: admin.id,
      },
    }),
    prisma.operationLog.create({
      data: {
        entityType: "Payment",
        entityId: payments[0].id,
        fieldName: "paidAmount",
        oldValue: 0,
        newValue: 10000,
        action: "UPDATE",
        detail: "陈先生种植牙首付 10000 元",
        operatorId: manager.id,
      },
    }),
    prisma.operationLog.create({
      data: {
        entityType: "Payment",
        entityId: payments[3].id,
        action: "CREATE",
        detail: "王阿姨义齿修复已全额付款 4500 元",
        operatorId: doctor.id,
      },
    }),
    prisma.operationLog.create({
      data: {
        entityType: "AbnormalRecord",
        entityId: abnormals[0].id,
        fieldName: "status",
        oldValue: "PENDING",
        newValue: "RESOLVED",
        action: "UPDATE",
        detail: "处理重复线索异常，已合并",
        operatorId: manager.id,
      },
    }),
  ]);

  console.log("🌱 种子数据完成！\n");
  console.log("  用户: 4 名（管理员/经理/前台/医生）");
  console.log("  客户: 6 名（带标签）");
  console.log("  咨询记录: 4 条");
  console.log("  线索: 7 条（含1条异常标记+1条撞单）");
  console.log("  阶段: 7 个");
  console.log("  回访规则: 3 条");
  console.log("  回访计划: 6 条（含2条已完成）");
  console.log("  回款: 4 条（已付/部分/未付）");
  console.log("  异常: 3 条（撞单/超时未跟/质量下降）");
  console.log("  日志: 6 条");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
