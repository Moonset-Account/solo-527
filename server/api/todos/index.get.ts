export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = { userId: user.id }
  if (query.status) where.status = query.status as string
  if (query.type) where.type = query.type as string

  const items = await db.todoItem.findMany({
    where,
    include: {
      batchTask: { select: { id: true, name: true, status: true } },
    },
    orderBy: { dueAt: 'asc' },
  })

  return items
})
