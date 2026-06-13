export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDB()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [pendingTodos, timeoutAlerts, todaySuggestions, weekSuggestions, recentTasks] = await Promise.all([
    db.todoItem.count({ where: { userId: user.id, status: 'pending' } }),
    db.todoItem.count({
      where: {
        userId: user.id,
        status: 'pending',
        type: 'rerun_timeout',
        dueAt: { lt: new Date() },
      },
    }),
    db.replySuggestion.findMany({
      where: { createdAt: { gte: today } },
      select: { isHit: true },
    }),
    db.replySuggestion.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { isHit: true },
    }),
    db.batchTask.findMany({
      where: user.role === 'supervisor' ? { createdBy: user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { creator: { select: { displayName: true } } },
    }),
  ])

  const calcRate = (items: { isHit: boolean }[]) => {
    const total = items.length
    const hitCount = items.filter(i => i.isHit).length
    return { total, hitCount, hitRate: total > 0 ? hitCount / total : 0 }
  }

  return {
    pendingTodoCount: pendingTodos,
    timeoutAlertCount: timeoutAlerts,
    todayHitRate: calcRate(todaySuggestions),
    weekHitRate: calcRate(weekSuggestions),
    recentTasks,
  }
})
