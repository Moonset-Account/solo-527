import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const count = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  })

  return { count }
})
