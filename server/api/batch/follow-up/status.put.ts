import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { batchResponse, errorResponse } from '~/server/utils/response'
import { createAuditLog } from '~/server/utils/audit'

const batchSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '请选择至少一条记录'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']),
  changeReason: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event, ['ADMIN', 'OPERATOR'])

  try {
    const body = await readBody(event)
    const { ids, status, changeReason } = batchSchema.parse(body)

    const totalCount = ids.length
    let successCount = 0
    let failCount = 0
    const failedItems: any[] = []

    const batchOp = await prisma.batchOperation.create({
      data: {
        batchNo: `BATCH${String(Date.now()).slice(-8)}`,
        operationType: 'FOLLOW_UP_STATUS_UPDATE',
        totalCount,
        status: 'PROCESSING',
        operatorId: user.id,
        parameters: { ids, status, changeReason }
      }
    })

    for (const id of ids) {
      try {
        const oldTask = await prisma.followUpTask.findUnique({
          where: { id }
        })

        if (!oldTask) {
          failCount++
          failedItems.push({ id, error: '任务不存在' })
          continue
        }

        const task = await prisma.followUpTask.update({
          where: { id },
          data: { status }
        })

        await createAuditLog(user, {
          operationType: 'BATCH_UPDATE',
          sourceType: 'FOLLOW_UP_TASK',
          sourceId: id,
          oldValue: oldTask,
          newValue: task,
          changeReason: changeReason || `批量更新状态为${status}`
        })

        successCount++
      } catch (err: any) {
        failCount++
        failedItems.push({ id, error: err.message || '更新失败' })
      }
    }

    await prisma.batchOperation.update({
      where: { id: batchOp.id },
      data: {
        successCount,
        failCount,
        status: failCount > 0 ? (successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
        failedItems,
        completedAt: new Date()
      }
    })

    return batchResponse(
      successCount,
      failCount,
      failedItems,
      { batchId: batchOp.id },
      `批量操作完成：成功 ${successCount} 条，失败 ${failCount} 条`
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    return errorResponse(error.message || '批量操作失败', 500)
  }
})
