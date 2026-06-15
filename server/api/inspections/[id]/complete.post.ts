import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)
  const body = await readBody(event)
  const { result, remark, images } = body

  const task = await prisma.inspectionTask.findUnique({ where: { id } })
  if (!task) {
    return errorResponse('巡检任务不存在', 404)
  }

  if (user.role === 'ENGINEER' && task.assigneeId !== user.id) {
    return errorResponse('无权处理此任务', 403)
  }

  const updatedTask = await prisma.inspectionTask.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actualDate: new Date(),
      result,
      remark,
      images: images ? JSON.stringify(images) : null
    }
  })

  return successResponse(updatedTask, '巡检任务完成')
})
