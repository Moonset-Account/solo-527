import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification || notification.userId !== user.id) {
    throw createError({
      statusCode: 404,
      statusMessage: '通知不存在',
    })
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  })

  return { success: true }
})
