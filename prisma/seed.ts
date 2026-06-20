import { PrismaClient, UserRole, KnowledgeType, KnowledgeStatus, HitStatus, TrajectoryActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: '张经理',
      role: UserRole.MANAGER,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      email: 'agent@example.com',
      name: '李客服',
      role: UserRole.AGENT,
    },
  });

  const knowledgeData = [
    {
      title: '如何处理商品退换货申请',
      content: '1. 确认商品是否在退换货期内（7天无理由，15天质量问题）\n2. 检查商品是否影响二次销售\n3. 引导用户填写退换货申请单\n4. 审核通过后安排上门取件\n5. 收到退货后24小时内处理退款',
      category: '退换货',
      tags: ['退货', '换货', '退款', '售后'],
      type: KnowledgeType.ANSWER,
      createdBy: manager.id,
    },
    {
      title: '物流配送异常处理流程',
      content: '1. 查询物流轨迹确认异常类型（延误/丢失/破损）\n2. 联系物流公司核实情况\n3. 根据异常类型采取对应措施：补发/赔偿/退款\n4. 同步用户处理进度\n5. 问题解决后关闭工单',
      category: '物流',
      tags: ['物流', '配送', '异常', '快递'],
      type: KnowledgeType.ANSWER,
      createdBy: manager.id,
    },
    {
      title: '商品质量问题鉴定指南',
      content: '## 步骤一：收集证据\n- 商品问题照片（多角度）\n- 订单截图\n- 包装照片\n\n## 步骤二：判断问题类型\n- 外观瑕疵：是否在允许范围内\n- 功能故障：能否复现\n- 损坏：发货时还是运输中\n\n## 步骤三：给出解决方案\n- 换货：同型号商品\n- 维修：指定维修点\n- 退款：全额/部分退款',
      category: '质量',
      tags: ['质量', '鉴定', '瑕疵', '故障'],
      type: KnowledgeType.TUTORIAL,
      createdBy: manager.id,
    },
    {
      title: '客户投诉升级处理规范',
      content: '当客户投诉满足以下条件之一时，需要升级至主管：\n1. 客户明确要求升级\n2. 涉及金额超过5000元\n3. 可能引发舆情风险\n4. 客服无法解决且超过24小时\n\n升级流程：\n1. 安抚客户情绪\n2. 记录详细情况\n3. 提交升级申请\n4. 主管15分钟内响应\n5. 跟进处理结果',
      category: '投诉',
      tags: ['投诉', '升级', '主管', '舆情'],
      type: KnowledgeType.ANSWER,
      createdBy: manager.id,
    },
    {
      title: '优惠券使用问题解答',
      content: '常见问题：\n1. 优惠券过期：可申请补发，每人每年限2次\n2. 优惠券无法使用：检查适用商品范围、门槛金额\n3. 退款后优惠券：未过期可退回，已过期作废\n4. 优惠券叠加：部分活动可叠加，具体以规则为准',
      category: '优惠券',
      tags: ['优惠券', '优惠', '促销', '退款'],
      type: KnowledgeType.ANSWER,
      status: KnowledgeStatus.PENDING_INVALID,
      invalidNote: '优惠券规则即将更新，待确认后处理',
      createdBy: manager.id,
    },
    {
      title: '家电安装服务预约教程',
      content: '### 预约方式\n1. 在线预约：官网-服务-安装预约\n2. 电话预约：400-XXX-XXXX\n3. APP预约：我的-服务预约\n\n### 预约注意事项\n- 提前1-3天预约\n- 准备好购机凭证\n- 确保安装环境符合要求\n- 家中留人配合\n\n### 安装后验收\n1. 检查外观是否完好\n2. 测试功能是否正常\n3. 确认配件齐全\n4. 签字确认服务单',
      category: '安装',
      tags: ['安装', '预约', '家电', '服务'],
      type: KnowledgeType.TUTORIAL,
      createdBy: manager.id,
    },
    {
      title: '老版本会员权益说明（已失效）',
      content: '此为2022版会员权益说明，已被新版本替代。主要变化：\n1. 积分有效期从永久改为1年\n2. 生日福利升级\n3. 新增专属客服通道',
      category: '会员',
      tags: ['会员', '权益', '积分'],
      type: KnowledgeType.ANSWER,
      status: KnowledgeStatus.INVALID,
      invalidNote: '内容已过时',
      invalidResult: '已更新为2024版会员权益说明',
      createdBy: manager.id,
    },
  ];

  await prisma.knowledge.createMany({
    data: knowledgeData,
    skipDuplicates: true,
  });

  const slaRules = [
    {
      name: '普通咨询响应SLA',
      description: '客户普通咨询的响应和处理时效规则',
      category: '咨询',
      conditions: [{ field: 'priority', operator: 'EQ', value: 'LOW' }],
      responseTime: 30,
      resolutionTime: 240,
      escalationLevels: [
        { level: 1, threshold: 30, notifyRoles: ['AGENT'], action: '提醒客服响应' },
        { level: 2, threshold: 120, notifyRoles: ['MANAGER'], action: '升级至主管' },
      ],
      createdBy: manager.id,
    },
    {
      name: '紧急投诉处理SLA',
      description: '客户紧急投诉的响应和升级规则',
      category: '投诉',
      conditions: [{ field: 'priority', operator: 'EQ', value: 'HIGH' }],
      responseTime: 5,
      resolutionTime: 60,
      escalationLevels: [
        { level: 1, threshold: 5, notifyRoles: ['AGENT', 'MANAGER'], action: '立即响应' },
        { level: 2, threshold: 30, notifyRoles: ['MANAGER', 'ADMIN'], action: '升级至运营经理' },
      ],
      createdBy: manager.id,
    },
    {
      name: '退换货处理SLA',
      description: '退换货申请的审核和处理时效',
      category: '退换货',
      conditions: [{ field: 'category', operator: 'EQ', value: 'REFUND' }],
      responseTime: 15,
      resolutionTime: 1440,
      escalationLevels: [
        { level: 1, threshold: 15, notifyRoles: ['AGENT'], action: '提醒审核' },
        { level: 2, threshold: 720, notifyRoles: ['MANAGER'], action: '催办处理' },
      ],
      createdBy: manager.id,
    },
  ];

  await prisma.sLARule.createMany({
    data: slaRules,
    skipDuplicates: true,
  });

  const tickets = [
    {
      title: '收到商品有破损',
      description: '客户收到的电子产品外壳有明显划痕，要求退换货',
      status: 'PROCESSING',
      priority: 'HIGH',
      customerId: 'CUST001',
    },
    {
      title: '物流信息三天未更新',
      description: '订单发出后物流信息一直停留在中转站',
      status: 'PENDING',
      priority: 'MEDIUM',
      customerId: 'CUST002',
    },
    {
      title: '优惠券无法使用',
      description: '满1000减100的优惠券结算时无法使用',
      status: 'RESOLVED',
      priority: 'LOW',
      customerId: 'CUST003',
    },
    {
      title: '申请退货退款',
      description: '衣服尺码不合适，申请7天无理由退货',
      status: 'PROCESSING',
      priority: 'MEDIUM',
      customerId: 'CUST004',
    },
    {
      title: '安装师傅未按时上门',
      description: '预约了今天上午安装，但师傅联系不上也没来',
      status: 'ESCALATED',
      priority: 'HIGH',
      customerId: 'CUST005',
    },
  ];

  await prisma.ticket.createMany({
    data: tickets,
    skipDuplicates: true,
  });
  const createdTickets = await prisma.ticket.findMany({ take: 5, orderBy: { createdAt: 'desc' } });

  const allKnowledge = await prisma.knowledge.findMany();
  const allSlaRules = await prisma.sLARule.findMany();

  for (let i = 0; i < createdTickets.length; i++) {
    const ticket = createdTickets[i];
    const knowledge = allKnowledge[i % allKnowledge.length];
    const slaRule = allSlaRules[i % allSlaRules.length];

    await prisma.knowledgeHit.create({
      data: {
        knowledgeId: knowledge.id,
        ticketId: ticket.id,
        matchScore: 0.85 - i * 0.1,
        matchKeywords: ['售后', '问题', '处理'],
        status: i === 0 ? HitStatus.PENDING : i === 1 ? HitStatus.VALID : HitStatus.FALSE_POSITIVE,
        screenedBy: i > 0 ? manager.id : undefined,
        screenedAt: i > 0 ? new Date() : undefined,
      },
    });

    await prisma.trajectory.createMany({
      data: [
        {
          ticketId: ticket.id,
          actionType: TrajectoryActionType.CREATE,
          description: '工单创建',
          beforeState: {},
          afterState: { status: 'CREATED' },
          operatorId: agent.id,
        },
        {
          ticketId: ticket.id,
          actionType: TrajectoryActionType.STATUS_CHANGE,
          description: '状态变更为处理中',
          beforeState: { status: 'CREATED' },
          afterState: { status: 'PROCESSING' },
          slaRuleId: slaRule.id,
          slaRuleSnapshot: slaRule,
          operatorId: agent.id,
          improvementAction: '已联系客户了解详细情况',
        },
        {
          ticketId: ticket.id,
          actionType: TrajectoryActionType.IMPROVEMENT,
          description: '执行改进措施',
          beforeState: { action: 'none' },
          afterState: { action: '已安排补发' },
          slaRuleId: slaRule.id,
          operatorId: agent.id,
          improvementAction: '已协调仓库优先补发，客户表示接受',
        },
      ],
    });

    if (ticket.status === 'RESOLVED') {
      await prisma.satisfaction.create({
        data: {
          ticketId: ticket.id,
          knowledgeId: knowledge.id,
          score: 5,
          feedback: '问题解决得很快，客服很专业',
          keywords: ['满意', '快速', '专业'],
        },
      });
    }
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
