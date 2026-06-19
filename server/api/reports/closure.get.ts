import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['manager', 'customer_service'])

  const [totalInspections, completedInspections, totalRectifications, completedRectifications, delayedRectifications] = await Promise.all([
    prisma.inspection.count(),
    prisma.inspection.count({ where: { status: 'completed' } }),
    prisma.rectification.count(),
    prisma.rectification.count({ where: { status: { in: ['completed', 'rechecked'] } } }),
    prisma.rectification.count({
      where: {
        status: { not: 'completed' },
        deadline: { lt: new Date() },
      },
    }),
  ])

  const closureRate = totalInspections > 0 ? completedInspections / totalInspections : 0
  const rectificationRate = totalRectifications > 0 ? completedRectifications / totalRectifications : 0

  const closedRectifications = await prisma.rectification.findMany({
    where: { status: { in: ['completed', 'rechecked'] }, completedAt: { not: null } },
    select: { createdAt: true, completedAt: true },
    take: 100,
    orderBy: { completedAt: 'desc' },
  })

  const avgClosureDays = closedRectifications.length > 0
    ? closedRectifications.reduce((sum, r) => {
        const days = r.completedAt
          ? (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          : 0
        return sum + days
      }, 0) / closedRectifications.length
    : 0

  return {
    totalInspections,
    completedInspections,
    totalRectifications,
    completedRectifications,
    closureRate: Number((closureRate * 100).toFixed(2)),
    rectificationRate: Number((rectificationRate * 100).toFixed(2)),
    avgClosureDays: Number(avgClosureDays.toFixed(1)),
    delayedCount: delayedRectifications,
  }
})
