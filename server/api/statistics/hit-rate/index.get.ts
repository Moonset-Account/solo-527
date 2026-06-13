export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = {}
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) (where.createdAt as any).gte = new Date(query.startDate as string)
    if (query.endDate) (where.createdAt as any).lte = new Date(query.endDate as string)
  }

  const suggestions = await db.replySuggestion.findMany({
    where,
    select: { isHit: true },
  })

  const total = suggestions.length
  const hitCount = suggestions.filter(s => s.isHit).length

  return { total, hitCount, hitRate: total > 0 ? hitCount / total : 0 }
})
