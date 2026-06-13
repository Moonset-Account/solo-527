export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const refs = await db.referenceSource.findMany({
    where: { isMissing: true },
    select: { missingReason: true, replySuggestionId: true },
  })

  const byReason: Record<string, { count: number; suggestionIds: Set<string> }> = {}
  for (const r of refs) {
    const reason = r.missingReason || '未知原因'
    if (!byReason[reason]) byReason[reason] = { count: 0, suggestionIds: new Set() }
    byReason[reason].count++
    byReason[reason].suggestionIds.add(r.replySuggestionId)
  }

  const totalSuggestions = await db.replySuggestion.count()

  return Object.entries(byReason).map(([missingReason, data]) => ({
    missingReason,
    count: data.count,
    affectedHitRate: totalSuggestions > 0 ? data.suggestionIds.size / totalSuggestions : 0,
  }))
})
