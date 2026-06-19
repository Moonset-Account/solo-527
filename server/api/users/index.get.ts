import { prisma } from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['manager'])
  const query = getQuery(event)

  const role = query.role as string | undefined

  const where: any = {}
  if (role) {
    where.role = role
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      avatar: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
})
