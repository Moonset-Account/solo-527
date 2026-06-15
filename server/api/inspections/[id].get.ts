import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)

  const task = await prisma.inspectionTask.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, phone: true } },
      satisfactionSurvey: true
    }
  })

  if (!task) {
    return errorResponse('巡检任务不存在', 404)
  }

  if (user.role === 'ENGINEER' && task.assigneeId !== user.id) {
    return errorResponse('无权查看此任务', 403)
  }

  return successResponse(task)
})
