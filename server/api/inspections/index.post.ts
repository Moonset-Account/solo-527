import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole, generateOrderNo } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const body = await readBody(event)
  const { title, description, type, location, assigneeId, planDate, items } = body

  if (!title || !type || !location || !planDate) {
    return errorResponse('请填写完整信息')
  }

  const task = await prisma.inspectionTask.create({
    data: {
      taskNo: generateOrderNo('INSP'),
      title,
      description,
      type,
      location,
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      planDate: new Date(planDate),
      items: items ? JSON.stringify(items) : null,
      status: 'PENDING'
    },
    include: {
      assignee: { select: { id: true, name: true } }
    }
  })

  return successResponse(task, '巡检任务创建成功')
})
