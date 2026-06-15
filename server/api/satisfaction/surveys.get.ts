import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const tenantId = query.tenantId ? parseInt(query.tenantId as string) : undefined
  const moduleType = query.moduleType as string

  const where: any = {}

  if (startDate) {
    where.surveyDate = { ...where.surveyDate, gte: dayjs(startDate).startOf('day').toDate() }
  }

  if (endDate) {
    where.surveyDate = { ...where.surveyDate, lte: dayjs(endDate).endOf('day').toDate() }
  }

  if (tenantId) {
    where.tenantId = tenantId
  } else if (user.role === 'TENANT') {
    where.tenantId = user.tenantId
  }

  const allSurveys = await prisma.satisfactionSurvey.findMany({
    where,
    include: {
      tenant: { select: { id: true, name: true } },
      respondent: { select: { id: true, name: true } },
      workOrder: { select: { id: true, orderNo: true, title: true } },
      inspectionTask: { select: { id: true, taskNo: true, title: true } },
      visitorAppointment: { select: { id: true, visitNo: true, visitorName: true } },
      engineeringRepair: { select: { id: true, repairNo: true, title: true } }
    },
    orderBy: { surveyDate: 'desc' }
  })

  let surveys = allSurveys
  if (moduleType && moduleType !== 'all') {
    surveys = allSurveys.filter((s: any) => {
      if (moduleType === 'WORKORDER') return !!s.workOrderId
      if (moduleType === 'INSPECTION') return !!s.inspectionTaskId
      if (moduleType === 'VISITOR') return !!s.visitorAppointmentId
      if (moduleType === 'ENGINEERING') return !!s.engineeringRepairId
      return true
    })
  }

  const total = surveys.length
  const startIdx = (page - 1) * pageSize
  const pageData = surveys.slice(startIdx, startIdx + pageSize)

  const getRelatedNo = (s: any) => {
    if (s.workOrder) return s.workOrder.orderNo
    if (s.inspectionTask) return s.inspectionTask.taskNo
    if (s.visitorAppointment) return s.visitorAppointment.visitNo
    if (s.engineeringRepair) return s.engineeringRepair.repairNo
    return '-'
  }
  const getModuleType = (s: any) => {
    if (s.workOrderId) return 'WORKORDER'
    if (s.inspectionTaskId) return 'INSPECTION'
    if (s.visitorAppointmentId) return 'VISITOR'
    if (s.engineeringRepairId) return 'ENGINEERING'
    return 'UNKNOWN'
  }

  const list = pageData.map(s => ({
    id: s.id,
    tenantName: s.tenant?.name,
    moduleType: getModuleType(s),
    relatedNo: getRelatedNo(s),
    overallScore: s.overallScore,
    responseSpeed: s.responseSpeed,
    serviceAttitude: s.serviceAttitude,
    repairQuality: s.repairQuality,
    costReasonableness: s.costReasonable,
    comment: s.comment,
    improvement: s.improvement,
    suggestion: s.improvement || s.comment,
    createdAt: s.surveyDate,
    respondentName: s.respondent?.name,
    overall: s.overallScore,
    costReasonable: s.costReasonable
  }))

  return successResponse({
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  })
})
