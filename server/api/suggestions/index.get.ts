export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = {}
  if (query.isHit !== undefined) {
    where.isHit = query.isHit === 'true'
  }
  if (query.questionId) {
    where.questionId = query.questionId as string
  }

  const suggestions = await db.replySuggestion.findMany({
    where,
    include: { references: true, question: { select: { id: true, content: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(query.limit) || 50,
    skip: Number(query.offset) || 0,
  })

  const total = await db.replySuggestion.count({ where })

  return { items: suggestions, total }
})
