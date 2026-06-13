export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw createError({ statusCode: 403, message: '无权访问' })
  }

  const db = useDB()
  const where: any = {}
  if (currentUser.role === 'supervisor') {
    where.supervisorId = currentUser.id
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      supervisorId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
})
