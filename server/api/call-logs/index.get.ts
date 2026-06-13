export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = {}
  if (query.batchTaskId) where.batchTaskId = query.batchTaskId as string
  if (query.questionId) where.questionId = query.questionId as string
  if (query.responseStatus) where.responseStatus = Number(query.responseStatus)
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) (where.createdAt as any).gte = new Date(query.startDate as string)
    if (query.endDate) (where.createdAt as any).lte = new Date(query.endDate as string)
  }

  const items = await db.callLog.findMany({
    where,
    include: {
      question: { select: { id: true, content: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(query.limit) || 50,
    skip: Number(query.offset) || 0,
  })

  const total = await db.callLog.count({ where })

  return { items, total }
})
