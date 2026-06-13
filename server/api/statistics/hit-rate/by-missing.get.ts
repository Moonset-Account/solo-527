export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const dateFilter: any = {}
  if (query.startDate || query.endDate) {
    if (query.startDate) dateFilter.gte = new Date(query.startDate as string)
    if (query.endDate) dateFilter.lte = new Date(query.endDate as string)
  }

  const suggestionWhere: any = { createdAt: dateFilter }
  if (query.supervisorId) {
    suggestionWhere.question = { batchTask: { createdBy: query.supervisorId as string } }
  }

  const allSuggestions = await db.replySuggestion.findMany({
    where: suggestionWhere,
    select: { id: true, isHit: true },
  })

  const suggestionIds = new Set(allSuggestions.map(s => s.id))
  const total = allSuggestions.length
  const hitCount = allSuggestions.filter(s => s.isHit).length

  const refs = await db.referenceSource.findMany({
    where: {
      isMissing: true,
      replySuggestionId: { in: Array.from(suggestionIds) },
    },
    select: { missingReason: true, replySuggestionId: true },
  })

  const byReason: Record<string, { count: number; suggestionIds: Set<string> }> = {}
  for (const r of refs) {
    const reason = r.missingReason || '未知原因'
    if (!byReason[reason]) byReason[reason] = { count: 0, suggestionIds: new Set() }
    byReason[reason].count++
    byReason[reason].suggestionIds.add(r.replySuggestionId)
  }

  const suggestionMap = new Map(allSuggestions.map(s => [s.id, s.isHit]))

  const result = Object.entries(byReason).map(([missingReason, data]) => {
    let affectedHitCount = 0
    for (const sid of data.suggestionIds) {
      if (suggestionMap.get(sid)) affectedHitCount++
    }
    const affectedTotal = data.suggestionIds.size
    return {
      missingReason,
      count: data.count,
      affectedSuggestionCount: affectedTotal,
      affectedHitCount,
      total,
      hitCount,
      hitRate: total > 0 ? hitCount / total : 0,
      affectedHitRate: affectedTotal > 0 ? affectedHitCount / affectedTotal : 0,
    }
  })

  return {
    total,
    hitCount,
    hitRate: total > 0 ? hitCount / total : 0,
    byReason: result,
  }
})
