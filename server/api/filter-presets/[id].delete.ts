import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const id = parseInt(event.context.params!.id)

  const preset = await prisma.filterPreset.findUnique({ where: { id } })
  if (!preset) {
    return errorResponse('筛选方案不存在', 404)
  }

  if (preset.userId !== user.id && user.role !== 'ADMIN') {
    return errorResponse('无权删除此筛选方案', 403)
  }

  await prisma.filterPreset.delete({ where: { id } })

  return successResponse(null, '删除成功')
})
