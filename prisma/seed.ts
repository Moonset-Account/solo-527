import { PrismaClient, UserRole, KnowledgeStatus, ExpireReason, RiskLevel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种数据...')

  const users = await prisma.user.createMany({
    data: [
      { name: '李管理员', email: 'admin@example.com', role: UserRole.ADMIN },
      { name: '张主管', email: 'supervisor@example.com', role: UserRole.SUPERVISOR },
      { name: '王培训', email: 'trainer@example.com', role: UserRole.TRAINER },
      { name: '刘培训', email: 'trainer2@example.com', role: UserRole.TRAINER },
      { name: '陈客服', email: 'agent@example.com', role: UserRole.AGENT },
    ],
    skipDuplicates: true,
  })

  console.log(`创建了 ${users.count} 个用户`)

  const trainer1 = await prisma.user.findUnique({ where: { email: 'trainer@example.com' } })
  const trainer2 = await prisma.user.findUnique({ where: { email: 'trainer2@example.com' } })
  const supervisor = await prisma.user.findUnique({ where: { email: 'supervisor@example.com' } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })

  if (!trainer1 || !trainer2 || !supervisor || !admin) {
    throw new Error('用户创建失败')
  }

  const knowledgeData = [
    {
      title: '产品退换货政策',
      content: '您好，我们的产品支持7天无理由退换货。商品需保持原包装完好，不影响二次销售。退换货时请提供购买凭证，运费由买家承担。如有质量问题，我们承担往返运费。退款将在收到退货后3个工作日内原路返回。',
      category: '政策文档',
      tags: ['退换货', '售后', '7天无理由'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
    {
      title: '会员积分规则说明',
      content: '您好，会员积分规则如下：1. 消费1元积1分；2. 积分有效期为获得之日起12个月；3. 100积分可抵扣1元现金；4. 生日当月消费享双倍积分；5. 积分可兑换优惠券或礼品。积分不可转让，不可兑现。',
      category: '常见问题',
      tags: ['积分', '会员', '规则'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
    {
      title: '配送时间及运费标准',
      content: '您好，我们的配送政策如下：1. 下单后24小时内发货；2. 普通快递3-5个工作日送达；3. 满99元包邮，不满99元收取10元运费；4. 偏远地区（新疆、西藏等）需额外支付20元运费；5. 支持加急配送，费用为20元，1-2个工作日送达。',
      category: '常见问题',
      tags: ['配送', '运费', '发货'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer2.id,
      ownerId: trainer2.id,
    },
    {
      title: '产品保修政策',
      content: '您好，本产品提供一年免费保修服务。保修范围包括非人为损坏的质量问题。以下情况不在保修范围内：1. 人为损坏；2. 不可抗力造成的损坏；3. 私自拆解改装；4. 超过保修期限。保修期内请凭购买凭证联系客服处理。',
      category: '政策文档',
      tags: ['保修', '售后', '质量'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
    {
      title: '优惠券使用规则',
      content: '您好，优惠券使用规则如下：1. 每张订单仅限使用一张优惠券；2. 优惠券有使用期限，过期作废；3. 优惠券不可兑换现金，不找零；4. 部分特价商品不参与优惠券活动；5. 使用优惠券的订单退款后优惠券不予退还。',
      category: '常见问题',
      tags: ['优惠券', '优惠', '规则'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer2.id,
      ownerId: trainer2.id,
    },
    {
      title: '账户安全保护指南',
      content: '您好，为保护您的账户安全，请遵循以下建议：1. 设置复杂度高的密码，包含大小写字母、数字和特殊字符；2. 定期更换密码；3. 不要在公共设备上勾选"记住密码"；4. 开启两步验证；5. 发现异常登录及时联系客服。',
      category: '培训材料',
      tags: ['安全', '账户', '密码'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
    {
      title: '旧版会员等级制度',
      content: '旧版会员等级分为普通会员、银卡会员、金卡会员、钻石会员四个等级。此制度已于2024年1月1日起废止，现已启用新版会员体系。',
      category: '政策文档',
      tags: ['会员', '等级', '旧版'],
      status: KnowledgeStatus.EXPIRED,
      expireReason: ExpireReason.POLICY_CHANGED,
      expireDate: new Date('2024-01-01'),
      createdById: trainer2.id,
      ownerId: trainer2.id,
    },
    {
      title: '2023年促销活动规则',
      content: '2023年双11促销活动规则：全场满300减50，满500减100。此活动已过期。',
      category: '常见问题',
      tags: ['促销', '活动', '2023'],
      status: KnowledgeStatus.EXPIRED,
      expireReason: ExpireReason.OUTDATED,
      expireDate: new Date('2023-11-12'),
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
    {
      title: '客服沟通话术规范',
      content: '客服沟通规范：1. 开头使用"您好，很高兴为您服务！"；2. 认真倾听客户问题，不要打断；3. 使用礼貌用语，保持耐心；4. 对于无法立即回答的问题，告知客户"我需要查询一下，请稍候"；5. 结束时询问"请问还有什么可以帮助您的吗？"',
      category: '培训材料',
      tags: ['客服', '沟通', '话术'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer2.id,
      ownerId: trainer2.id,
    },
    {
      title: '投诉处理流程',
      content: '投诉处理流程：1. 认真倾听客户投诉，记录问题详情；2. 向客户表示歉意；3. 分析问题原因，给出解决方案；4. 如需升级处理，告知客户处理时限；5. 跟进处理结果，确保客户满意；6. 记录投诉处理过程，持续改进服务。',
      category: '培训材料',
      tags: ['投诉', '处理流程', '服务'],
      status: KnowledgeStatus.ACTIVE,
      createdById: trainer1.id,
      ownerId: trainer1.id,
    },
  ]

  for (const data of knowledgeData) {
    await prisma.knowledgeBase.upsert({
      where: { title: data.title },
      update: {},
      create: data,
    })
  }

  console.log(`创建了 ${knowledgeData.length} 条知识库数据`)

  const promptVersion = await prisma.promptVersion.upsert({
    where: { version: 'v1.0.0' },
    update: {},
    create: {
      version: 'v1.0.0',
      content: `你是一个专业的客服助手，请根据以下知识库内容回答客户问题：
      {knowledge_context}
      
      客户问题：{question}
      
      请按照以下格式回复：
      1. 先礼貌问候
      2. 针对问题给出准确回答
      3. 列出参考的知识库条目
      4. 提示内容仅供参考`,
      description: '基础客服回复模板',
      isActive: true,
      createdById: admin.id,
    },
  })

  console.log(`创建了提示词版本: ${promptVersion.version}`)

  const sampleConversations = [
    {
      question: '我想退货，怎么操作？',
      reply: '您好，关于退货操作，根据知识库内容，回复建议如下：\n\n您好，我们的产品支持7天无理由退换货。商品需保持原包装完好，不影响二次销售。退换货时请提供购买凭证，运费由买家承担。如有质量问题，我们承担往返运费。退款将在收到退货后3个工作日内原路返回。\n\n---\n参考资料：\n1. 产品退换货政策 (匹配度: 85%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'ACCEPTED',
      accuracyScore: 0.95,
    },
    {
      question: '积分怎么用？',
      reply: '您好，关于积分使用，根据知识库内容，回复建议如下：\n\n您好，会员积分规则如下：1. 消费1元积1分；2. 积分有效期为获得之日起12个月；3. 100积分可抵扣1元现金；4. 生日当月消费享双倍积分；5. 积分可兑换优惠券或礼品。积分不可转让，不可兑现。\n\n---\n参考资料：\n1. 会员积分规则说明 (匹配度: 75%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'ACCEPTED',
      accuracyScore: 0.9,
    },
    {
      question: '几天能到货？',
      reply: '您好，关于配送时间，根据知识库内容，回复建议如下：\n\n您好，我们的配送政策如下：1. 下单后24小时内发货；2. 普通快递3-5个工作日送达；3. 满99元包邮，不满99元收取10元运费；4. 偏远地区（新疆、西藏等）需额外支付20元运费；5. 支持加急配送，费用为20元，1-2个工作日送达。\n\n---\n参考资料：\n1. 配送时间及运费标准 (匹配度: 80%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'MODIFIED',
      accuracyScore: 0.85,
    },
    {
      question: '坏了怎么办？',
      reply: '您好，关于产品保修，根据知识库内容，回复建议如下：\n\n您好，本产品提供一年免费保修服务。保修范围包括非人为损坏的质量问题。以下情况不在保修范围内：1. 人为损坏；2. 不可抗力造成的损坏；3. 私自拆解改装；4. 超过保修期限。保修期内请凭购买凭证联系客服处理。\n\n---\n参考资料：\n1. 产品保修政策 (匹配度: 70%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'ACCEPTED',
      accuracyScore: 0.88,
    },
    {
      question: '优惠券可以叠加使用吗？',
      reply: '您好，关于优惠券使用，根据知识库内容，回复建议如下：\n\n您好，优惠券使用规则如下：1. 每张订单仅限使用一张优惠券；2. 优惠券有使用期限，过期作废；3. 优惠券不可兑换现金，不找零；4. 部分特价商品不参与优惠券活动；5. 使用优惠券的订单退款后优惠券不予退还。\n\n---\n参考资料：\n1. 优惠券使用规则 (匹配度: 90%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'ACCEPTED',
      accuracyScore: 0.92,
    },
    {
      question: '我的账户安全吗？',
      reply: '您好，关于账户安全，根据知识库内容，回复建议如下：\n\n您好，为保护您的账户安全，请遵循以下建议：1. 设置复杂度高的密码，包含大小写字母、数字和特殊字符；2. 定期更换密码；3. 不要在公共设备上勾选"记住密码"；4. 开启两步验证；5. 发现异常登录及时联系客服。\n\n---\n参考资料：\n1. 账户安全保护指南 (匹配度: 78%)\n\n以上内容仅供参考，请根据实际情况灵活调整。',
      status: 'PENDING',
      accuracyScore: null,
    },
  ]

  const returnPolicy = await prisma.knowledgeBase.findUnique({ where: { title: '产品退换货政策' } })
  const pointsPolicy = await prisma.knowledgeBase.findUnique({ where: { title: '会员积分规则说明' } })
  const shippingPolicy = await prisma.knowledgeBase.findUnique({ where: { title: '配送时间及运费标准' } })
  const warrantyPolicy = await prisma.knowledgeBase.findUnique({ where: { title: '产品保修政策' } })
  const couponPolicy = await prisma.knowledgeBase.findUnique({ where: { title: '优惠券使用规则' } })
  const securityGuide = await prisma.knowledgeBase.findUnique({ where: { title: '账户安全保护指南' } })

  const conversationKnowledgeMap = [
    returnPolicy,
    pointsPolicy,
    shippingPolicy,
    warrantyPolicy,
    couponPolicy,
    securityGuide,
  ]

  for (let i = 0; i < sampleConversations.length; i++) {
    const conv = sampleConversations[i]
    const conversation = await prisma.conversation.create({
      data: {
        customerQuestion: conv.question,
        suggestedReply: conv.reply,
        finalReply: conv.status !== 'PENDING' ? conv.reply : null,
        status: conv.status as any,
        accuracyScore: conv.accuracyScore,
        userId: supervisor.id,
        promptVersionId: promptVersion.id,
      },
    })

    const knowledge = conversationKnowledgeMap[i]
    if (knowledge) {
      await prisma.retrievalRecord.create({
        data: {
          conversationId: conversation.id,
          knowledgeId: knowledge.id,
          sourceType: 'KNOWLEDGE_BASE',
          relevanceScore: 0.7 + Math.random() * 0.25,
          isHit: true,
          position: 1,
        },
      })
    }

    if (conv.status === 'MODIFIED') {
      await prisma.generationLog.create({
        data: {
          conversationId: conversation.id,
          previousResult: conv.reply,
          currentResult: conv.reply + '\n\n[客服主管补充]：如需了解具体配送进度，可在"我的订单"中查看物流信息。',
          changeReason: '补充了物流查询方式',
          changedBy: supervisor.name,
        },
      })
    }
  }

  console.log(`创建了 ${sampleConversations.length} 条会话记录`)

  const highRiskConv = await prisma.conversation.findFirst({
    where: { status: 'PENDING' },
  })

  if (highRiskConv) {
    await prisma.riskSample.create({
      data: {
        conversationId: highRiskConv.id,
        riskLevel: RiskLevel.HIGH,
        description: '客户询问账户安全问题，可能存在账户被盗风险，需要重点关注。',
        isResolved: false,
        knowledgeItems: {
          create: securityGuide ? [{
            knowledgeId: securityGuide.id,
            isSource: true,
          }] : [],
        },
      },
    })
    console.log('创建了风险样本记录')
  }

  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    await prisma.dailyReport.upsert({
      where: { date: new Date(date.setHours(0, 0, 0, 0)) },
      update: {},
      create: {
        date: new Date(date.setHours(0, 0, 0, 0)),
        totalConversations: Math.floor(Math.random() * 50) + 20,
        hitRate: 0.6 + Math.random() * 0.3,
        accuracyRate: 0.7 + Math.random() * 0.25,
        avgResponseTime: Math.floor(Math.random() * 30) + 10,
        knowledgeUsed: Math.floor(Math.random() * 15) + 5,
        expiredKnowledge: 2,
        riskCount: Math.floor(Math.random() * 3),
        generatedById: admin.id,
      },
    })
  }

  console.log('创建了最近7天的报表数据')

  await prisma.notification.createMany({
    data: [
      {
        userId: supervisor.id,
        type: 'SYSTEM',
        title: '欢迎使用客服会话知识检索助手',
        message: '系统已初始化完成，您可以开始使用知识检索功能了。',
        status: 'UNREAD',
      },
      {
        userId: trainer1.id,
        type: 'KNOWLEDGE_EXPIRING',
        title: '知识即将过期提醒',
        message: '您负责的"旧版会员等级制度"知识条目已于2024-01-01过期，请及时更新。',
        status: 'UNREAD',
      },
    ],
  })

  console.log('创建了通知数据')

  console.log('数据播种完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
