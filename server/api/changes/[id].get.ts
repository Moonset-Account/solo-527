import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')

  const change = await prisma.changeRequest.findUnique({
    where: { id },
    include: {
      alert: { select: { id: true, alertNo: true, title: true, level: true, status: true } },
      submitter: { select: { id: true, realName: true, username: true } },
      approver: { select: { id: true, realName: true, username: true } },
      operationLogs: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, realName: true } } },
        take: 50
      }
    }
  })

  if (!change) {
    throw createError({ statusCode: 404, statusMessage: '变更申请不存在' })
  }

  return change
})
