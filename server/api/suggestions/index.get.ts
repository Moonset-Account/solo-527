export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = {}
  if (query.isHit !== undefined && query.isHit !== '') {
    where.isHit = query.isHit === 'true'
  }
  if (query.questionId) {
    where.questionId = query.questionId as string
  }
  if (query.batchTaskId) {
    where.question = where.question || {}
    where.question.batchTaskId = query.batchTaskId as string
  }
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) (where.createdAt as any).gte = new Date(query.startDate as string)
    if (query.endDate) (where.createdAt as any).lte = new Date(query.endDate as string)
  }
  if (query.hasMissingReference === 'true') {
    where.references = { some: { isMissing: true } }
  }

  const suggestions = await db.replySuggestion.findMany({
    where,
    include: { references: true, question: { select: { id: true, content: true, batchTaskId: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(query.limit) || 200,
    skip: Number(query.offset) || 0,
  })

  const total = await db.replySuggestion.count({ where })

  return { items: suggestions, total }
})
