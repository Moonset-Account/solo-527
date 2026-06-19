import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['manager'])
  const body = await readBody(event)

  const { type, targetIds, params } = body

  if (!type || !targetIds || !Array.isArray(targetIds)) {
    throw createError({
      statusCode: 400,
      statusMessage: '操作类型和目标列表不能为空',
    })
  }

  const batchOperation = await prisma.batchOperation.create({
    data: {
      type,
      status: 'executing',
      totalCount: targetIds.length,
      targetIds,
      operatorId: user.id,
    },
  })

  let successCount = 0
  const failedRecords: any[] = []

  for (const targetId of targetIds) {
    try {
      switch (type) {
        case 'assign_inspection': {
          const project = await prisma.project.findUnique({
            where: { id: targetId },
            select: { status: true, name: true },
          })

          if (!project || project.status !== 'in_progress') {
            throw new Error(project ? '项目不在进行中状态' : '项目不存在')
          }

          await prisma.inspection.create({
            data: {
              projectId: targetId,
              title: params?.title || '例行巡检',
              inspectorId: params?.inspectorId,
              scheduledAt: params?.scheduledAt ? new Date(params.scheduledAt) : new Date(),
              status: 'pending',
            },
          })

          break
        }

        case 'update_status': {
          await prisma.project.update({
            where: { id: targetId },
            data: { status: params?.status },
          })
          break
        }

        case 'notify_owner': {
          const project = await prisma.project.findUnique({
            where: { id: targetId },
            select: { ownerId: true, name: true },
          })

          if (project) {
            await prisma.notification.create({
              data: {
                userId: project.ownerId,
                type: 'delay_warning',
                title: '项目提醒',
                content: params?.message || `关于项目「${project.name}」的提醒`,
                relatedId: targetId,
              },
            })
          }
          break
        }
      }

      successCount++
    } catch (error: any) {
      const project = await prisma.project.findUnique({
        where: { id: targetId },
        select: { name: true },
      })

      failedRecords.push({
        batchOperationId: batchOperation.id,
        targetId,
        targetName: project?.name || targetId,
        errorMessage: error.message || '操作失败',
        assignee: user.id,
      })
    }
  }

  if (failedRecords.length > 0) {
    await prisma.failedRecord.createMany({
      data: failedRecords,
    })
  }

  const finalStatus = failedRecords.length === 0 ? 'completed' : 'partial_failed'

  const updated = await prisma.batchOperation.update({
    where: { id: batchOperation.id },
    data: {
      status: finalStatus,
      successCount,
      failedCount: failedRecords.length,
      completedAt: new Date(),
    },
    include: {
      failedRecords: true,
      operator: { select: { name: true } },
    },
  })

  return {
    ...updated,
    operatorName: updated.operator.name,
    targetIds,
  }
})
