import { prisma } from '../../../plugins/prisma'
import { requireAdmin } from '../../../utils/auth'
import { createLog } from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')

  const change = await prisma.changeRequest.findUnique({ where: { id } })
  if (!change) {
    throw createError({ statusCode: 404, statusMessage: '变更申请不存在' })
  }

  if (change.status !== 'APPROVED') {
    throw createError({ statusCode: 400, statusMessage: '只有已批准的变更可以开启变更窗口' })
  }

  const beforeData = { status: change.status, windowOpenedAt: change.windowOpenedAt }

  const updated = await prisma.changeRequest.update({
    where: { id },
    data: {
      status: 'IMPLEMENTING',
      windowOpenedAt: new Date()
    }
  })

  await createLog({
    actionType: 'CHANGE_WINDOW_OPEN',
    userId: user.id,
    changeId: id,
    alertId: change.alertId,
    beforeData,
    afterData: { status: updated.status, windowOpenedAt: updated.windowOpenedAt },
    note: '变更窗口已开启'
  })

  return updated
})
