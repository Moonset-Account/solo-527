export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const dateFilter: any = {}
  if (query.startDate || query.endDate) {
    if (query.startDate) dateFilter.gte = new Date(query.startDate as string)
    if (query.endDate) dateFilter.lte = new Date(query.endDate as string)
  }

  const supervisors = await db.user.findMany({
    where: { role: 'supervisor' },
    select: { id: true, displayName: true },
  })

  const result = []
  for (const sup of supervisors) {
    const suggestions = await db.replySuggestion.findMany({
      where: {
        createdAt: dateFilter,
        question: { batchTask: { createdBy: sup.id } },
      },
      select: { isHit: true },
    })

    const total = suggestions.length
    const hitCount = suggestions.filter(s => s.isHit).length
    result.push({
      supervisorId: sup.id,
      supervisorName: sup.displayName,
      total,
      hitCount,
      hitRate: total > 0 ? hitCount / total : 0,
    })
  }

  return result
})
