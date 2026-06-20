import { prisma } from '../../utils/prisma'
import { ok } from '../../utils/response'

export default defineEventHandler(async () => {
  const now = new Date()
  let createdTodos = 0
  let syncedPatrol = 0

  const timeoutRects = await prisma.rectification.findMany({
    where: {
      completed: false,
      deadline: { lt: now },
      issue: { status: { in: ['RECTIFYING', 'VOTING', 'PENDING'] } }
    },
    include: { issue: true }
  })

  for (const rect of timeoutRects) {
    const exist = await prisma.todo.findFirst({
      where: { issueId: rect.issueId, type: 'RECTIFY_TIMEOUT', fromTimeout: true, createdAt: { gte: new Date(rect.deadline!) } }
    })
    if (!exist) {
      await prisma.todo.create({
        data: {
          issueId: rect.issueId,
          type: 'RECTIFY_TIMEOUT',
          title: `整改超时 - ${rect.issue.title}`,
          description: rect.action,
          assignee: rect.handler || rect.issue.handler,
          deadline: new Date(now.getTime() + 24 * 3600 * 1000),
          fromTimeout: true
        }
      })
      createdTodos++
      if (rect.issue.gridNo) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const stat = await prisma.patrolStat.upsert({
          where: { date_gridNo: { date: today, gridNo: rect.issue.gridNo } },
          create: { date: today, gridNo: rect.issue.gridNo, timeoutTodoCount: 1 },
          update: { timeoutTodoCount: { increment: 1 } },
          select: { id: true }
        })
        syncedPatrol++
        await prisma.todo.updateMany({
          where: { issueId: rect.issueId, type: 'RECTIFY_TIMEOUT', fromTimeout: true, patrolSynced: false },
          data: { patrolSynced: true }
        })
      }
    }
  }

  const overdueDeadlines = await prisma.issue.findMany({
    where: {
      rectifyDeadline: { lt: now, not: null },
      status: { in: ['RECTIFYING', 'PENDING', 'VOTING'] }
    }
  })
  for (const issue of overdueDeadlines) {
    const exist = await prisma.todo.findFirst({
      where: { issueId: issue.id, type: 'ISSUE_TIMEOUT', fromTimeout: true }
    })
    if (!exist) {
      await prisma.todo.create({
        data: {
          issueId: issue.id,
          type: 'ISSUE_TIMEOUT',
          title: `议题超时 - ${issue.title}`,
          description: `截止时间: ${issue.rectifyDeadline?.toISOString()}`,
          assignee: issue.handler,
          deadline: new Date(now.getTime() + 12 * 3600 * 1000),
          fromTimeout: true
        }
      })
      createdTodos++
      if (issue.gridNo) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        await prisma.patrolStat.upsert({
          where: { date_gridNo: { date: today, gridNo: issue.gridNo } },
          create: { date: today, gridNo: issue.gridNo, timeoutTodoCount: 1 },
          update: { timeoutTodoCount: { increment: 1 } }
        })
        syncedPatrol++
        await prisma.todo.updateMany({
          where: { issueId: issue.id, type: 'ISSUE_TIMEOUT', fromTimeout: true, patrolSynced: false },
          data: { patrolSynced: true }
        })
      }
    }
  }

  return ok({ createdTodos, syncedPatrol, scannedRect: timeoutRects.length, scannedIssue: overdueDeadlines.length })
})
