import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const body = await readBody(event)
  const {
    workOrderId,
    tenantId,
    overallScore,
    responseSpeed,
    serviceAttitude,
    repairQuality,
    costReasonable,
    comment,
    improvement,
    sourceType,
    sourceId
  } = body

  if (!overallScore || !responseSpeed || !serviceAttitude || !repairQuality || !costReasonable) {
    return errorResponse('请填写所有评分项')
  }

  const survey = await prisma.satisfactionSurvey.create({
    data: {
      workOrderId: workOrderId ? parseInt(workOrderId) : null,
      tenantId: tenantId ? parseInt(tenantId) : user.tenantId,
      respondentId: user.id,
      overallScore: parseInt(overallScore),
      responseSpeed: parseInt(responseSpeed),
      serviceAttitude: parseInt(serviceAttitude),
      repairQuality: parseInt(repairQuality),
      costReasonable: parseInt(costReasonable),
      comment,
      improvement,
      sourceType: sourceType || 'WORK_ORDER',
      sourceId: sourceId ? parseInt(sourceId) : null
    }
  })

  return successResponse(survey, '评价提交成功')
})
