import { prisma } from '../../plugins/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      storeCode: true,
      phone: true,
      email: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return { data: users }
})
