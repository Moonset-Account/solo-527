import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')

  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, realName: true, username: true } },
      acknowledger: { select: { id: true, realName: true, username: true } },
      changeRequests: {
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: { select: { id: true, realName: true } },
          approver: { select: { id: true, realName: true } }
        }
      },
      operationLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, realName: true } }
        },
        take: 50
      }
    }
  })

  if (!alert) {
    throw createError({ statusCode: 404, statusMessage: '告警不存在' })
  }

  return alert
})
