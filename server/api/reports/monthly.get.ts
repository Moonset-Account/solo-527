import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['manager', 'customer_service'])
  const query = getQuery(event)

  const month = query.month as string || new Date().toISOString().substring(0, 7)
  const startDate = new Date(`${month}-01`)
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

  const [totalProjects, completedProjects, delayedProjects, budgetChanges, inspections, rectifications] = await Promise.all([
    prisma.project.count({
      where: { createdAt: { lte: endDate } },
    }),
    prisma.project.count({
      where: {
        status: 'completed',
        updatedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.project.count({
      where: {
        status: { not: 'completed' },
        endDate: { lt: startDate },
      },
    }),
    prisma.budgetVersion.findMany({
      where: {
        status: 'confirmed',
        confirmedAt: { gte: startDate, lte: endDate },
      },
      select: { changeAmount: true },
    }),
    prisma.inspection.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true, status: true, createdAt: true, completedAt: true },
    }),
    prisma.rectification.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true, status: true, createdAt: true, completedAt: true },
    }),
  ])

  const totalBudgetChange = budgetChanges.reduce((sum, b) => sum + Number(b.changeAmount), 0)

  const completedInspections = inspections.filter(i => i.status === 'completed').length
  const completedRectifications = rectifications.filter(r => r.status === 'completed' || r.status === 'rechecked').length

  const closureRate = inspections.length > 0 ? completedInspections / inspections.length : 0

  const closedRectifications = rectifications.filter(r => r.completedAt)
  const avgRectificationDays = closedRectifications.length > 0
    ? closedRectifications.reduce((sum, r) => {
        const days = r.completedAt
          ? (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          : 0
        return sum + days
      }, 0) / closedRectifications.length
    : 0

  return {
    month,
    totalProjects,
    completedProjects,
    delayedProjects,
    totalBudgetChange,
    closureRate: Number((closureRate * 100).toFixed(2)),
    avgRectificationDays: Number(avgRectificationDays.toFixed(1)),
    totalInspections: inspections.length,
    completedInspections,
    totalRectifications: rectifications.length,
    completedRectifications,
  }
})
