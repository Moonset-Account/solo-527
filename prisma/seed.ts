import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const supervisor = await prisma.user.upsert({
    where: { clerkId: "seed-supervisor-001" },
    update: {},
    create: {
      clerkId: "seed-supervisor-001",
      email: "supervisor@example.com",
      name: "张主管",
      role: "SUPERVISOR",
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { clerkId: "seed-staff-001" },
    update: {},
    create: {
      clerkId: "seed-staff-001",
      email: "staff1@example.com",
      name: "李客服",
      role: "STAFF",
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { clerkId: "seed-staff-002" },
    update: {},
    create: {
      clerkId: "seed-staff-002",
      email: "staff2@example.com",
      name: "王客服",
      role: "STAFF",
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { clerkId: "seed-customer-001" },
    update: {},
    create: {
      clerkId: "seed-customer-001",
      email: "customer1@example.com",
      name: "赵客户",
      role: "CUSTOMER",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { clerkId: "seed-customer-002" },
    update: {},
    create: {
      clerkId: "seed-customer-002",
      email: "customer2@example.com",
      name: "钱客户",
      role: "CUSTOMER",
    },
  });

  const knowledge1 = await prisma.knowledgeEntry.create({
    data: {
      title: "产品退货流程",
      content: "客户申请退货需要在购买后7天内，保留原包装...",
      category: "PRODUCT",
      version: "1.0",
    },
  });

  const knowledge2 = await prisma.knowledgeEntry.create({
    data: {
      title: "账单查询指引",
      content: "客户可通过个人中心→订单管理→账单详情查看...",
      category: "BILLING",
      version: "2.1",
    },
  });

  const knowledge3 = await prisma.knowledgeEntry.create({
    data: {
      title: "系统登录故障排查",
      content: "常见原因：1.密码错误 2.账号被锁定 3.浏览器缓存...",
      category: "TECHNICAL",
      version: "1.3",
    },
  });

  const feedbacks = await Promise.all([
    prisma.feedback.create({
      data: {
        title: "产品页面加载缓慢",
        description: "在移动端访问产品详情页时，页面加载需要超过10秒，严重影响购物体验。",
        category: "TECHNICAL",
        urgency: "HIGH",
        status: "IN_PROGRESS",
        customerId: customer1.id,
        assigneeId: staff1.id,
        knowledgeEntryId: knowledge3.id,
        rootCause: "前端资源未压缩，图片未做懒加载",
        result: "已提交前端优化方案，预计3天内完成",
        firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        attachments: {
          create: [
            { name: "screenshot.png", url: "/uploads/screenshot.png", size: 256000, mimeType: "image/png" },
          ],
        },
        notes: {
          create: [
            { authorId: staff1.id, content: "已确认问题，移动端首屏加载时间确实过长" },
            { authorId: supervisor.id, content: "请优先处理，已关联知识库条目" },
          ],
        },
      },
    }),
    prisma.feedback.create({
      data: {
        title: "退款金额计算错误",
        description: "使用了优惠券的订单退款时，退款金额未扣除优惠券分摊部分，导致退款金额偏高。",
        category: "BILLING",
        urgency: "CRITICAL",
        status: "PENDING_REVIEW",
        customerId: customer2.id,
        assigneeId: staff2.id,
        knowledgeEntryId: knowledge2.id,
        rootCause: "退款计算模块未考虑优惠券分摊逻辑",
        result: "已修复退款计算公式，补充了优惠券分摊扣减逻辑",
        firstResponseAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ratings: {
          create: [{ score: 2, comment: "退款问题影响了我的信任" }],
        },
      },
    }),
    prisma.feedback.create({
      data: {
        title: "客服响应速度太慢",
        description: "在线客服排队等待时间超过30分钟，且客服人员态度冷淡。",
        category: "SERVICE",
        urgency: "HIGH",
        status: "PENDING",
        customerId: customer1.id,
      },
    }),
    prisma.feedback.create({
      data: {
        title: "功能建议：添加商品对比功能",
        description: "希望能在产品页面同时选择多个商品进行参数对比，方便选购决策。",
        category: "PRODUCT",
        urgency: "LOW",
        status: "CLOSED",
        customerId: customer2.id,
        assigneeId: staff1.id,
        result: "已记录为产品需求，预计下个版本迭代",
        firstResponseAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        ratings: {
          create: [{ score: 4, comment: "感谢记录，期待上线" }],
        },
      },
    }),
    prisma.feedback.create({
      data: {
        title: "其他咨询",
        description: "请问你们的营业时间是什么时候？",
        category: "OTHER",
        urgency: "MEDIUM",
        status: "CLOSED",
        customerId: customer1.id,
        assigneeId: staff2.id,
        result: "营业时间为周一至周五 9:00-18:00",
        firstResponseAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 71 * 60 * 60 * 1000),
        ratings: {
          create: [{ score: 5 }],
        },
      },
    }),
  ]);

  await Promise.all([
    prisma.responseTimeRecord.createMany({
      data: [
        { feedbackId: feedbacks[0].id, responseMinutes: 120, type: "FIRST_RESPONSE" },
        { feedbackId: feedbacks[1].id, responseMinutes: 60, type: "FIRST_RESPONSE" },
        { feedbackId: feedbacks[3].id, responseMinutes: 2880, type: "FIRST_RESPONSE" },
        { feedbackId: feedbacks[3].id, responseMinutes: 1440, type: "FULL_RESOLUTION" },
        { feedbackId: feedbacks[4].id, responseMinutes: 60, type: "FIRST_RESPONSE" },
        { feedbackId: feedbacks[4].id, responseMinutes: 60, type: "FULL_RESOLUTION" },
      ],
    }),
    prisma.knowledgeHit.createMany({
      data: [
        { knowledgeEntryId: knowledge1.id, feedbackId: feedbacks[3].id, helpful: true },
        { knowledgeEntryId: knowledge2.id, feedbackId: feedbacks[1].id, helpful: false },
        { knowledgeEntryId: knowledge3.id, feedbackId: feedbacks[0].id, helpful: true },
      ],
    }),
  ]);

  await prisma.todo.createMany({
    data: [
      {
        title: "低分评价跟进: 退款金额计算错误",
        type: "LOW_RATING",
        priority: "HIGH",
        relatedFeedbackId: feedbacks[1].id,
        description: "客户评分 2/5，评语: 退款问题影响了我的信任",
      },
      {
        title: "新反馈待处理: 客服响应速度太慢",
        type: "UNCLOSED_FEEDBACK",
        priority: "HIGH",
        relatedFeedbackId: feedbacks[2].id,
        dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    ],
  });

  const improvement = await prisma.improvement.create({
    data: {
      title: "修复退款计算模块优惠券分摊逻辑",
      description: "退款计算模块需要增加优惠券分摊扣减逻辑，确保退款金额准确",
      status: "IN_PROGRESS",
      rootCause: "退款计算模块未考虑优惠券分摊逻辑",
      assigneeId: staff2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      feedbacks: {
        create: [{ feedbackId: feedbacks[1].id }],
      },
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: "FEEDBACK",
        entityId: feedbacks[0].id,
        action: "CREATED",
        userId: customer1.id,
        newValue: JSON.stringify({ title: "产品页面加载缓慢" }),
      },
      {
        entityType: "FEEDBACK",
        entityId: feedbacks[0].id,
        action: "STATUS_CHANGED",
        userId: staff1.id,
        oldValue: "PENDING",
        newValue: "IN_PROGRESS",
      },
      {
        entityType: "FEEDBACK",
        entityId: feedbacks[1].id,
        action: "CREATED",
        userId: customer2.id,
        newValue: JSON.stringify({ title: "退款金额计算错误" }),
      },
      {
        entityType: "FEEDBACK",
        entityId: feedbacks[1].id,
        action: "STATUS_CHANGED",
        userId: staff2.id,
        oldValue: "IN_PROGRESS",
        newValue: "PENDING_REVIEW",
      },
      {
        entityType: "IMPROVEMENT",
        entityId: improvement.id,
        action: "CREATED",
        userId: supervisor.id,
        newValue: JSON.stringify({ title: "修复退款计算模块优惠券分摊逻辑" }),
      },
      {
        entityType: "KNOWLEDGE_HIT",
        entityId: "seed-hit",
        action: "RECORDED",
        userId: staff1.id,
        newValue: JSON.stringify({ entryId: knowledge3.id, helpful: true }),
      },
    ],
  });

  console.log("Seed data created successfully!");
  console.log({ supervisor, staff1, staff2, customer1, customer2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
