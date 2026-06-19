import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'
import { redis } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager'])
  const projectId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { title, inspectorId, scheduledAt, budgetVersionId, remark } = body

  if (!title || !inspectorId || !scheduledAt) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的巡检信息',
    })
  }

  const inspection = await prisma.inspection.create({
    data: {
      projectId,
      title,
      inspectorId,
      scheduledAt: new Date(scheduledAt),
      budgetVersionId: budgetVersionId || null,
      remark: remark || null,
      status: 'pending',
    },
    include: {
      inspector: { select: { name: true, id: true } },
      project: { select: { name: true } },
    },
  })

  await prisma.notification.create({
    data: {
      userId: inspectorId,
      type: 'inspection_assigned',
      title: '新的巡检任务',
      content: `您被分派了项目「${inspection.project.name}」的巡检任务：${title}，请按时完成。`,
      relatedId: inspection.id,
    },
  })

  await redis.del(`project:${projectId}:inspections`)

  return {
    id: inspection.id,
    projectId: inspection.projectId,
    projectName: inspection.project.name,
    title: inspection.title,
    inspectorId: inspection.inspectorId,
    inspectorName: inspection.inspector.name,
    status: inspection.status,
    scheduledAt: inspection.scheduledAt,
    budgetVersionId: inspection.budgetVersionId,
    remark: inspection.remark,
    createdAt: inspection.createdAt,
  }
})
