import { hashPassword } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDB()

  const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } })
  if (existingAdmin) {
    return { message: '种子数据已存在', users: [] }
  }

  const admin = await db.user.create({
    data: {
      username: 'admin',
      displayName: '系统管理员',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
    },
  })

  const supervisors = []
  for (let i = 1; i <= 3; i++) {
    const sup = await db.user.create({
      data: {
        username: `supervisor${i}`,
        displayName: `客服主管${i}`,
        passwordHash: hashPassword('123456'),
        role: 'supervisor',
      },
    })
    supervisors.push(sup)
  }

  const agents = []
  for (let i = 1; i <= 6; i++) {
    const sup = supervisors[(i - 1) % supervisors.length]
    const agent = await db.user.create({
      data: {
        username: `agent${i}`,
        displayName: `客服专员${i}`,
        passwordHash: hashPassword('123456'),
        role: 'agent',
        supervisorId: sup.id,
      },
    })
    agents.push(agent)
  }

  const questions = [
    '我的订单为什么还没发货？',
    '退款什么时候到账？',
    '商品有质量问题如何退换？',
    '如何修改收货地址？',
    '优惠券怎么使用？',
    '配送范围包括哪些地区？',
    '发票怎么开具？',
    '会员积分如何兑换？',
    '可以货到付款吗？',
    '如何查看物流信息？',
  ]

  const batchTasks = []
  for (let t = 0; t < 3; t++) {
    const task = await db.batchTask.create({
      data: {
        name: `批量生成任务${t + 1}`,
        status: 'completed',
        totalItems: 5 + t * 2,
        completedItems: 5 + t * 2,
        timeoutMinutes: 30,
        config: { generateCount: 5 + t * 2, llmModel: 'mock', temperature: 0.7 },
        createdBy: supervisors[t % supervisors.length].id,
        scheduledAt: new Date(Date.now() - (3 - t) * 24 * 3600 * 1000),
        startedAt: new Date(Date.now() - (3 - t) * 24 * 3600 * 1000 + 1000),
        completedAt: new Date(Date.now() - (3 - t) * 24 * 3600 * 1000 + 30000),
      },
    })
    batchTasks.push(task)
  }

  const refTitles = ['订单发货流程FAQ', '退款政策说明', '售后服务指南', '配送范围与时效', '优惠券使用规则', '发票开具指南', '会员积分规则']
  const missingReasons = ['文档已过期', '知识库未收录', '引用匹配失败']

  for (const task of batchTasks) {
    for (let q = 0; q < task.totalItems; q++) {
      const question = await db.question.create({
        data: {
          content: questions[q % questions.length],
          batchTaskId: task.id,
          createdBy: supervisors[0].id,
          createdAt: new Date(task.completedAt!.getTime() - Math.random() * 20000),
        },
      })

      const isHit = Math.random() > 0.35
      const confidence = isHit ? 0.75 + Math.random() * 0.25 : 0.3 + Math.random() * 0.4

      const suggestion = await db.replySuggestion.create({
        data: {
          questionId: question.id,
          content: isHit
            ? `您好，针对您的问题"${question.content}"，已为您查询相关信息，请参考以下指引操作。如有疑问请随时联系。`
            : `抱歉，关于"${question.content}"的问题，暂未找到完全匹配的答案，建议您联系人工客服获取进一步帮助。`,
          confidence,
          isHit,
          hitVerifiedBy: isHit && Math.random() > 0.5 ? agents[Math.floor(Math.random() * agents.length)].id : null,
          createdAt: question.createdAt,
        },
      })

      const refCount = 1 + Math.floor(Math.random() * 3)
      for (let r = 0; r < refCount; r++) {
        const isMissing = Math.random() < 0.15
        await db.referenceSource.create({
          data: {
            replySuggestionId: suggestion.id,
            docTitle: refTitles[(q + r) % refTitles.length],
            docUrl: `/docs/${refTitles[(q + r) % refTitles.length].replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '')}`,
            relevanceScore: 0.5 + Math.random() * 0.5,
            isMissing,
            missingReason: isMissing ? missingReasons[Math.floor(Math.random() * missingReasons.length)] : null,
          },
        })
      }

      await db.callLog.create({
        data: {
          batchTaskId: task.id,
          questionId: question.id,
          endpoint: '/api/suggestions/generate',
          requestBody: { content: question.content },
          responseStatus: 200,
          responseBody: { suggestionId: suggestion.id },
          durationMs: Math.floor(200 + Math.random() * 1500),
          createdAt: question.createdAt,
        },
      })
    }
  }

  const pendingTask = await db.batchTask.create({
    data: {
      name: '待处理生成任务',
      status: 'pending',
      totalItems: 10,
      completedItems: 0,
      timeoutMinutes: 30,
      config: { generateCount: 10, llmModel: 'mock', temperature: 0.7 },
      createdBy: supervisors[0].id,
    },
  })

  const timeoutTask = await db.batchTask.create({
    data: {
      name: '超时生成任务',
      status: 'timeout',
      totalItems: 8,
      completedItems: 3,
      timeoutMinutes: 30,
      config: { generateCount: 8, llmModel: 'mock', temperature: 0.7 },
      createdBy: supervisors[1].id,
      scheduledAt: new Date(Date.now() - 2 * 3600 * 1000),
      startedAt: new Date(Date.now() - 2 * 3600 * 1000 + 1000),
    },
  })

  await db.todoItem.createMany({
    data: [
      {
        userId: supervisors[0].id,
        batchTaskId: pendingTask.id,
        type: 'review',
        status: 'pending',
        dueAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      {
        userId: supervisors[0].id,
        batchTaskId: pendingTask.id,
        type: 'verify_hit',
        status: 'pending',
        dueAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      {
        userId: supervisors[1].id,
        batchTaskId: timeoutTask.id,
        type: 'rerun_timeout',
        status: 'pending',
        dueAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        userId: supervisors[0].id,
        batchTaskId: null,
        type: 'check_reference',
        status: 'pending',
        dueAt: new Date(Date.now() + 2 * 3600 * 1000),
      },
    ],
  })

  return {
    message: '种子数据创建成功',
    users: { admin: admin.id, supervisors: supervisors.map(s => s.id), agents: agents.map(a => a.id) },
  }
})
