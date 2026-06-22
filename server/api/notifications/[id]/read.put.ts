import { prisma } from '../../../plugins/prisma'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') || '0')

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: '通知不存在' })
  }
  if (notification.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: '无权操作此通知' })
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() }
  })
})
