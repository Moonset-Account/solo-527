import { requireAuth } from '~/server/utils/response'
import { successResponse, errorResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const { action, resolution } = body

  if (!action) {
    return errorResponse('操作类型不能为空', 400)
  }

  const prisma = usePrisma()

  const alert = await prisma.temperatureAlert.findUnique({
    where: { id: BigInt(id) },
  })

  if (!alert) {
    return errorResponse('告警不存在', 404)
  }

  let result

  if (action === 'acknowledge') {
    result = await prisma.$transaction(async (tx) => {
      const updated = await tx.temperatureAlert.update({
        where: { id: BigInt(id) },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedBy: BigInt(auth.userId),
          acknowledgedAt: new Date(),
        },
      })

      const view = await tx.processingView.findUnique({
        where: {
          bizType_bizId: {
            bizType: 'TEMPERATURE_ALERT',
            bizId: BigInt(id),
          },
        },
      })

      if (view) {
        await tx.processingView.update({
          where: { id: view.id },
          data: {
            status: 'ACKNOWLEDGED',
            lastProcessedAt: new Date(),
            lastProcessedBy: BigInt(auth.userId),
            lastRemark: '告警已确认',
          },
        })

        await tx.processingNote.create({
          data: {
            viewId: view.id,
            operatorId: BigInt(auth.userId),
            operatorName: auth.realName || auth.username,
            actionType: 'STATUS_CHANGE',
            fromStatus: 'OPEN',
            toStatus: 'ACKNOWLEDGED',
            remark: '确认告警',
          },
        })
      }

      return updated
    })
  } else if (action === 'resolve') {
    result = await prisma.$transaction(async (tx) => {
      const updated = await tx.temperatureAlert.update({
        where: { id: BigInt(id) },
        data: {
          status: 'RESOLVED',
          resolvedBy: BigInt(auth.userId),
          resolvedAt: new Date(),
          resolution: resolution || '',
        },
      })

      const view = await tx.processingView.findUnique({
        where: {
          bizType_bizId: {
            bizType: 'TEMPERATURE_ALERT',
            bizId: BigInt(id),
          },
        },
      })

      if (view) {
        await tx.processingView.update({
          where: { id: view.id },
          data: {
            status: 'RESOLVED',
            lastProcessedAt: new Date(),
            lastProcessedBy: BigInt(auth.userId),
            lastRemark: resolution ? `告警已解决：${resolution}` : '告警已解决',
          },
        })

        await tx.processingNote.create({
          data: {
            viewId: view.id,
            operatorId: BigInt(auth.userId),
            operatorName: auth.realName || auth.username,
            actionType: 'STATUS_CHANGE',
            fromStatus: 'ACKNOWLEDGED',
            toStatus: 'RESOLVED',
            remark: resolution || '解决告警',
          },
        })
      }

      return updated
    })
  } else if (action === 'ignore') {
    result = await prisma.temperatureAlert.update({
      where: { id: BigInt(id) },
      data: {
        status: 'IGNORED',
        acknowledgedBy: BigInt(auth.userId),
        acknowledgedAt: new Date(),
      },
    })
  } else {
    return errorResponse('不支持的操作类型', 400)
  }

  return successResponse(result, '操作成功')
})
