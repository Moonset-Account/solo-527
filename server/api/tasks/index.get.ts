export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = {}
  if (query.status) {
    where.status = query.status as string
  }
  if (user.role === 'supervisor') {
    where.createdBy = user.id
  }

  const tasks = await db.batchTask.findMany({
    where,
    include: {
      creator: { select: { id: true, displayName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return tasks
})
