import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async () => {
  const total = await prisma.issue.count()
  const statusCount = await prisma.issue.groupBy({
    by: ['status'],
    _count: { _all: true }
  })
  const priorityCount = await prisma.issue.groupBy({
    by: ['priority'],
    _count: { _all: true }
  })
  const categoryCount = await prisma.issue.groupBy({
    by: ['category'],
    _count: { _all: true },
    take: 10,
    orderBy: { _count: { _all: 'desc' } }
  })
  const timeoutRect = await prisma.rectification.count({
    where: { completed: false, deadline: { lt: new Date() } }
  })
  const openTodos = await prisma.todo.count({ where: { done: false } })
  return ok({
    total,
    statusCount: Object.fromEntries(statusCount.map(i => [i.status, i._count._all])),
    priorityCount: Object.fromEntries(priorityCount.map(i => [i.priority, i._count._all])),
    categoryCount,
    timeoutRect,
    openTodos
  })
})
