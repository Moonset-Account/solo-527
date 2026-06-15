import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole, generateOrderNo } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const body = await readBody(event)
  const {
    title,
    description,
    type,
    priority,
    location,
    contactName,
    contactPhone,
    expectedDate,
    deadline
  } = body

  if (!title || !description || !type || !location || !contactName || !contactPhone) {
    return errorResponse('请填写完整信息')
  }

  if (!user.tenantId) {
    return errorResponse('租户信息不存在')
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      orderNo: generateOrderNo('WO'),
      title,
      description,
      type,
      priority: priority || 'MEDIUM',
      creatorId: user.id,
      tenantId: user.tenantId,
      location,
      contactName,
      contactPhone,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      status: 'PENDING'
    },
    include: {
      creator: { select: { id: true, name: true } },
      tenant: { select: { id: true, name: true } }
    }
  })

  return successResponse(workOrder, '工单提交成功')
})
