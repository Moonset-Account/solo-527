import prisma from '~/server/utils/prisma'
import { verifyToken, generateOrderNo } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const body = await readBody(event)
  const {
    title,
    description,
    equipmentName,
    equipmentModel,
    faultDescription,
    priority,
    location,
    reporterName,
    reporterPhone,
    deadline
  } = body

  if (!title || !description || !location) {
    return errorResponse('请填写完整信息')
  }

  const repair = await prisma.engineeringRepair.create({
    data: {
      repairNo: generateOrderNo('ENG'),
      title,
      description,
      equipmentName,
      equipmentModel,
      faultDescription,
      type: 'REPAIR',
      priority: priority || 'MEDIUM',
      location,
      reporterName,
      reporterPhone,
      creatorId: user.id,
      deadline: deadline ? new Date(deadline) : null
    },
    include: {
      creator: { select: { id: true, name: true } },
      handler: { select: { id: true, name: true } }
    }
  })

  return successResponse(repair, '工程报修创建成功')
})
