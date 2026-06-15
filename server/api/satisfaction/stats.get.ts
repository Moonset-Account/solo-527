import prisma from '~/server/utils/prisma'
import { verifyToken, requireRole } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  requireRole(user, ['OPERATOR', 'ADMIN'])

  const query = getQuery(event)
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const tenantId = query.tenantId ? parseInt(query.tenantId as string) : undefined

  const where: any = {}

  if (startDate) {
    where.surveyDate = { ...where.surveyDate, gte: new Date(startDate) }
  }

  if (endDate) {
    where.surveyDate = { ...where.surveyDate, lte: new Date(endDate) }
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  const surveys = await prisma.satisfactionSurvey.findMany({
    where,
    include: {
      tenant: { select: { id: true, name: true } },
      respondent: { select: { id: true, name: true } },
      workOrder: { select: { id: true, orderNo: true, title: true } }
    },
    orderBy: { surveyDate: 'desc' }
  })

  const total = surveys.length
  const avgOverall = total > 0
    ? surveys.reduce((sum, s) => sum + s.overallScore, 0) / total
    : 0
  const avgSpeed = total > 0
    ? surveys.reduce((sum, s) => sum + s.responseSpeed, 0) / total
    : 0
  const avgAttitude = total > 0
    ? surveys.reduce((sum, s) => sum + s.serviceAttitude, 0) / total
    : 0
  const avgQuality = total > 0
    ? surveys.reduce((sum, s) => sum + s.repairQuality, 0) / total
    : 0
  const avgCost = total > 0
    ? surveys.reduce((sum, s) => sum + s.costReasonable, 0) / total
    : 0

  const scoreDist = {
    score5: surveys.filter(s => s.overallScore === 5).length,
    score4: surveys.filter(s => s.overallScore === 4).length,
    score3: surveys.filter(s => s.overallScore === 3).length,
    score2: surveys.filter(s => s.overallScore === 2).length,
    score1: surveys.filter(s => s.overallScore === 1).length
  }

  const tenantStats: any[] = []
  if (surveys.length > 0) {
    const tenantMap = new Map()
    for (const s of surveys) {
      if (!tenantMap.has(s.tenantId)) {
        tenantMap.set(s.tenantId, {
          tenantId: s.tenantId,
          tenantName: s.tenant?.name,
          count: 0,
          totalScore: 0
        })
      }
      const stat = tenantMap.get(s.tenantId)
      stat.count++
      stat.totalScore += s.overallScore
    }
    for (const stat of tenantMap.values()) {
      tenantStats.push({
        ...stat,
        avgScore: stat.totalScore / stat.count
      })
    }
    tenantStats.sort((a, b) => b.avgScore - a.avgScore)
  }

  return successResponse({
    total,
    avgOverall: parseFloat(avgOverall.toFixed(2)),
    avgSpeed: parseFloat(avgSpeed.toFixed(2)),
    avgAttitude: parseFloat(avgAttitude.toFixed(2)),
    avgQuality: parseFloat(avgQuality.toFixed(2)),
    avgCost: parseFloat(avgCost.toFixed(2)),
    scoreDist,
    tenantStats,
    surveys
  })
})
