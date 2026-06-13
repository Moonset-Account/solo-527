export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const supervisors = await db.user.findMany({
    where: { role: 'supervisor' },
    select: { id: true, displayName: true },
  })

  const result = []
  for (const sup of supervisors) {
    const taskWhere: any = { createdBy: sup.id }
    if (query.startDate || query.endDate) {
      taskWhere.createdAt = {}
      if (query.startDate) (taskWhere.createdAt as any).gte = new Date(query.startDate as string)
      if (query.endDate) (taskWhere.createdAt as any).lte = new Date(query.endDate as string)
    }

    const tasks = await db.batchTask.findMany({
      where: taskWhere,
      select: { id: true },
    })

    const taskIds = tasks.map(t => t.id)

    const suggestions = await db.replySuggestion.findMany({
      where: {
        question: { batchTaskId: { in: taskIds } },
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
