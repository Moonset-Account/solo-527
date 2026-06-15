import prisma from '~/server/utils/prisma'
import { verifyToken, generateOrderNo } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const body = await readBody(event)
  const {
    visitorName,
    visitorPhone,
    visitorIdCard,
    visitorCompany,
    visitDate,
    visitEndDate,
    purpose,
    visitorCount,
    tenantId,
    hostName,
    hostPhone
  } = body

  if (!visitorName || !visitorPhone || !visitDate || !purpose || !hostName || !hostPhone || !tenantId) {
    return errorResponse('请填写完整信息')
  }

  const appointment = await prisma.visitorAppointment.create({
    data: {
      visitNo: generateOrderNo('VIS'),
      visitorName,
      visitorPhone,
      visitorIdCard: visitorIdCard || null,
      visitorCompany: visitorCompany || null,
      visitDate: new Date(visitDate),
      visitEndDate: visitEndDate ? new Date(visitEndDate) : null,
      purpose,
      visitorCount: visitorCount || 1,
      tenantId,
      hostName,
      hostPhone,
      creatorId: user.id,
      status: 'PENDING'
    },
    include: {
      tenant: { select: { id: true, name: true } }
    }
  })

  return successResponse(appointment, '预约提交成功')
})
