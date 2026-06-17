import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const { range = '30' } = query
  const days = Number(range)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [
    statusStats,
    typeStats,
    actionStats,
    userEfficiency,
    deadlineStats,
    gapStats,
    lawyerReviewTime
  ] = await Promise.all([
    prisma.contract.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.contract.groupBy({
      by: ['contractType'],
      _count: { id: true },
      _avg: { amount: true },
      _sum: { amount: true }
    }),
    prisma.operationLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    }),
    (async () => {
      const logs = await prisma.operationLog.findMany({
        where: {
          action: { in: ['SUBMIT_OPINION', 'ASSIGN_LAWYER', 'ASSIGN_REVIEWER', 'COMPLETE'] },
          createdAt: { gte: startDate }
        },
        include: { user: { select: { id: true, name: true, role: true } } }
      })
      const userMap: Record<string, { userId: string; name: string; role: string; assignCount: number; opinionCount: number; completeCount: number }> = {}
      for (const log of logs) {
        if (!userMap[log.userId]) {
          userMap[log.userId] = {
            userId: log.userId,
            name: log.user.name,
            role: log.user.role,
            assignCount: 0,
            opinionCount: 0,
            completeCount: 0
          }
        }
        if (log.action === 'ASSIGN_LAWYER' || log.action === 'ASSIGN_REVIEWER') userMap[log.userId].assignCount++
        if (log.action === 'SUBMIT_OPINION') userMap[log.userId].opinionCount++
        if (log.action === 'COMPLETE') userMap[log.userId].completeCount++
      }
      return Object.values(userMap)
    })(),
    (async () => {
      const now = new Date()
      const in7Days = new Date()
      in7Days.setDate(in7Days.getDate() + 7)
      return {
        rectifyUrgent: await prisma.contract.count({
          where: { rectifyDeadline: { lte: now, not: null }, status: { in: ['PENDING_RECTIFICATION', 'RECTIFYING'] } }
        }),
        rectifyIn7Days: await prisma.contract.count({
          where: {
            rectifyDeadline: { gte: now, lte: in7Days, not: null },
            status: { in: ['PENDING_RECTIFICATION', 'RECTIFYING'] }
          }
        }),
        reviewInProgress: await prisma.contract.count({
          where: { status: { in: ['LAWYER_REVIEWING', 'REVIEWER_REVIEWING'] } }
        }),
        pendingAssignment: await prisma.contract.count({
          where: { status: { in: ['NEW', 'LAWYER_COMPLETED'] } }
        })
      }
    })(),
    prisma.complianceGap.groupBy({
      by: ['status', 'severity'],
      _count: { id: true }
    }),
    (async () => {
      const completed = await prisma.contract.findMany({
        where: { status: 'COMPLETED' },
        include: {
          assignments: { orderBy: { createdAt: 'asc' }, take: 1 },
          logs: {
            where: { action: 'CHANGE_STATUS' },
            orderBy: { createdAt: 'asc' }
          }
        },
        take: 50,
        orderBy: { updatedAt: 'desc' }
      })

      return completed.map(c => {
        const startTime = c.createdAt
        const endTime = c.updatedAt
        const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10
        return {
          contractId: c.id,
          contractNo: c.contractNo,
          title: c.title,
          lawyerId: c.assignments[0]?.lawyerId,
          durationHours,
          completedAt: endTime
        }
      })
    })()
  ])

  function decimalToNumber(d: any): number {
    if (!d) return 0
    if (typeof d === 'number') return d
    try { return Number(d) } catch { return 0 }
  }

  const totalAmountValue = typeStats.reduce((s: number, t: any) => s + decimalToNumber(t._sum?.amount), 0)
  const avgAmountValue = typeStats.length
    ? typeStats.reduce((s: number, t: any) => s + decimalToNumber(t._avg?.amount), 0) / typeStats.length
    : 0

  return {
    overview: {
      totalContracts: statusStats.reduce((s, c) => s + c._count.id, 0),
      completedContracts: statusStats.find(c => c.status === 'COMPLETED')?._count.id || 0,
      inProgressContracts: statusStats.filter(c => !['COMPLETED', 'ERROR', 'NEW'].includes(c.status)).reduce((s, c) => s + c._count.id, 0),
      newContracts: statusStats.find(c => c.status === 'NEW')?._count.id || 0,
      errorContracts: statusStats.find(c => c.status === 'ERROR')?._count.id || 0,
      totalAmount: totalAmountValue,
      avgAmount: avgAmountValue
    },
    statusStats,
    typeStats,
    actionStats,
    userEfficiency,
    deadlineStats,
    gapStats,
    lawyerReviewTime,
    dateRange: { from: startDate, to: new Date() }
  }
})
