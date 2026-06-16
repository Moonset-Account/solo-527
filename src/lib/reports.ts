import prisma from './prisma'

export interface DailyStats {
  date: string
  totalConversations: number
  hitRate: number
  accuracyRate: number
  avgResponseTime: number
  knowledgeUsed: number
  expiredKnowledge: number
  riskCount: number
}

export const generateDailyReport = async (
  date: Date,
  userId: string
) => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const conversations = await prisma.conversation.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      retrievalRecords: true,
      riskSample: true,
    },
  })

  const totalConversations = conversations.length

  const conversationsWithRetrieval = conversations.filter((c: typeof conversations[number]) => c.retrievalRecords.length > 0)
  const hitConversations = conversationsWithRetrieval.filter((c: typeof conversationsWithRetrieval[number]) =>
    c.retrievalRecords.some((r: { isHit: boolean }) => r.isHit)
  )
  const hitRate = conversationsWithRetrieval.length > 0
    ? hitConversations.length / conversationsWithRetrieval.length
    : 0

  const conversationsWithAccuracy = conversations.filter((c: typeof conversations[number]) => c.accuracyScore !== null)
  const accuracyRate = conversationsWithAccuracy.length > 0
    ? conversationsWithAccuracy.reduce((sum: number, c: typeof conversationsWithAccuracy[number]) => sum + (c.accuracyScore || 0), 0) / conversationsWithAccuracy.length
    : 0

  const uniqueKnowledgeUsed = new Set(
    conversations.flatMap((c: typeof conversations[number]) => c.retrievalRecords.map((r: { knowledgeId: string }) => r.knowledgeId))
  ).size

  const expiredKnowledge = await prisma.knowledgeBase.count({
    where: {
      status: 'EXPIRED',
    },
  })

  const riskCount = conversations.filter((c: typeof conversations[number]) => c.riskSample !== null).length

  const report = await prisma.dailyReport.upsert({
    where: {
      date: startOfDay,
    },
    update: {
      totalConversations,
      hitRate,
      accuracyRate,
      knowledgeUsed: uniqueKnowledgeUsed,
      expiredKnowledge,
      riskCount,
    },
    create: {
      date: startOfDay,
      totalConversations,
      hitRate,
      accuracyRate,
      avgResponseTime: 0,
      knowledgeUsed: uniqueKnowledgeUsed,
      expiredKnowledge,
      riskCount,
      generatedById: userId,
    },
  })

  return report
}

export const getReportTrend = async (days = 7): Promise<DailyStats[]> => {
  const reports = await prisma.dailyReport.findMany({
    orderBy: {
      date: 'desc',
    },
    take: days,
  })

  return reports
    .sort((a: { date: { getTime: () => number } }, b: { date: { getTime: () => number } }) => a.date.getTime() - b.date.getTime())
    .map((report: { date: { toISOString: () => string }; totalConversations: number; hitRate: number; accuracyRate: number; avgResponseTime: number; knowledgeUsed: number; expiredKnowledge: number; riskCount: number }) => ({
      date: report.date.toISOString().split('T')[0],
      totalConversations: report.totalConversations,
      hitRate: report.hitRate,
      accuracyRate: report.accuracyRate,
      avgResponseTime: report.avgResponseTime,
      knowledgeUsed: report.knowledgeUsed,
      expiredKnowledge: report.expiredKnowledge,
      riskCount: report.riskCount,
    }))
}

export const getCoverageByOwner = async (): Promise<Array<{
  ownerName: string
  total: number
  active: number
  expired: number
  underReview: number
}>> => {
  const knowledgeByOwner = await prisma.knowledgeBase.groupBy({
    by: ['ownerId', 'status'],
    _count: true,
  })

  const owners = await prisma.user.findMany({
    where: {
      role: 'TRAINER',
    },
    select: {
      id: true,
      name: true,
    },
  })

  const ownerMap = new Map(owners.map((o: { id: string; name: string }) => [o.id, o.name]))

  const result = new Map<string, {
    ownerName: string
    total: number
    active: number
    expired: number
    underReview: number
  }>()

  for (const item of knowledgeByOwner) {
    const ownerName: string = ownerMap.get(item.ownerId) || '未知负责人'
    if (!result.has(item.ownerId)) {
      result.set(item.ownerId, {
        ownerName,
        total: 0,
        active: 0,
        expired: 0,
        underReview: 0,
      })
    }
    const stats = result.get(item.ownerId)!
    stats.total += item._count
    if (item.status === 'ACTIVE') stats.active += item._count
    else if (item.status === 'EXPIRED') stats.expired += item._count
    else if (item.status === 'UNDER_REVIEW') stats.underReview += item._count
  }

  return Array.from(result.values())
}

export const getExpireReasonStats = async (): Promise<Array<{
  reason: string
  count: number
}>> => {
  const expiredKnowledge = await prisma.knowledgeBase.findMany({
    where: {
      status: 'EXPIRED',
      expireReason: {
        not: null,
      },
    },
    select: {
      expireReason: true,
    },
  })

  const reasonMap = new Map<string, number>()

  for (const item of expiredKnowledge) {
    const reason = item.expireReason || 'OTHER'
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1)
  }

  const reasonLabels: Record<string, string> = {
    OUTDATED: '内容过时',
    POLICY_CHANGED: '政策变更',
    PRODUCT_UPDATED: '产品更新',
    REGULATION_CHANGED: '法规变更',
    DUPLICATE: '重复内容',
    OTHER: '其他原因',
  }

  return Array.from(reasonMap.entries()).map(([reason, count]) => ({
    reason: reasonLabels[reason] || reason,
    count,
  }))
}

export const getKnowledgeByDate = async (): Promise<Array<{
  date: string
  count: number
}>> => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const knowledgeByDate = await prisma.knowledgeBase.groupBy({
    by: ['createdAt'],
    _count: true,
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const dateMap = new Map<string, number>()

  for (const item of knowledgeByDate) {
    const date = item.createdAt.toISOString().split('T')[0]
    dateMap.set(date, (dateMap.get(date) || 0) + item._count)
  }

  return Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}
