export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const startDate = query.startDate ? new Date(query.startDate as string) : new Date(Date.now() - 30 * 24 * 3600 * 1000)
  const endDate = query.endDate ? new Date(query.endDate as string) : new Date()

  const suggestions = await db.replySuggestion.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { isHit: true, createdAt: true },
  })

  const byDate: Record<string, { total: number; hitCount: number }> = {}
  for (const s of suggestions) {
    const dateKey = s.createdAt.toISOString().split('T')[0]
    if (!byDate[dateKey]) byDate[dateKey] = { total: 0, hitCount: 0 }
    byDate[dateKey].total++
    if (s.isHit) byDate[dateKey].hitCount++
  }

  return Object.entries(byDate).map(([date, data]) => ({
    date,
    total: data.total,
    hitCount: data.hitCount,
    hitRate: data.total > 0 ? data.hitCount / data.total : 0,
  })).sort((a, b) => a.date.localeCompare(b.date))
})
