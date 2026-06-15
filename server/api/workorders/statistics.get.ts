import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const where: any = {}

  if (user.role === 'TENANT') {
    where.tenantId = user.tenantId
  }

  if (user.role === 'ENGINEER') {
    where.assignments = {
      some: {
        assigneeId: user.id
      }
    }
  }

  const [total, pending, processing, completed, today, overdue] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.count({ where: { ...where, status: { in: ['PENDING', 'ASSIGNED'] } } }),
    prisma.workOrder.count({ where: { ...where, status: { in: ['IN_PROGRESS', 'MATERIAL_NEEDED'] } } }),
    prisma.workOrder.count({ where: { ...where, status: { in: ['COMPLETED', 'REVIEWED', 'CLOSED'] } } }),
    prisma.workOrder.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.workOrder.count({ where: { ...where, status: 'OVERDUE' } })
  ])

  return successResponse({
    total,
    pending,
    processing,
    completed,
    today,
    overdue
  })
})
