import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const { status, handlerRemark } = body

  const prisma = usePrisma()

  const exception = await prisma.apiExceptionLog.findUnique({
    where: { id: BigInt(id) },
  })

  if (!exception) {
    throw createError({
      statusCode: 404,
      statusMessage: '异常日志不存在',
    })
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.apiExceptionLog.update({
      where: { id: BigInt(id) },
      data: {
        status: status || exception.status,
        handlerId: BigInt(auth.userId),
        handlerRemark: handlerRemark || undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
    })

    const view = await tx.processingView.findUnique({
      where: {
        bizType_bizId: {
          bizType: 'API_EXCEPTION',
          bizId: BigInt(id),
        },
      },
    })

    if (view) {
      await tx.processingView.update({
        where: { id: view.id },
        data: {
          status: status || view.status,
          currentHandlerId: BigInt(auth.userId),
          currentHandlerName: auth.realName || auth.username,
          lastProcessedAt: new Date(),
          lastProcessedBy: BigInt(auth.userId),
          lastRemark: handlerRemark || `状态更新为：${status}`,
        },
      })

      await tx.processingNote.create({
        data: {
          viewId: view.id,
          operatorId: BigInt(auth.userId),
          operatorName: auth.realName || auth.username,
          actionType: status ? 'STATUS_CHANGE' : 'COMMENT',
          fromStatus: exception.status,
          toStatus: status || undefined,
          remark: handlerRemark || '处理备注',
        },
      })
    }

    return updated
  })

  return successResponse(result, '操作成功')
})
