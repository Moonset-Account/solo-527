export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { enqueueBatchTask, processTaskFallback } = await import('~/server/utils/queue')
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  const now = new Date()
  const updated = await db.batchTask.update({
    where: { id },
    data: {
      status: 'scheduled',
      completedItems: 0,
      scheduledAt: now,
      startedAt: null,
      completedAt: null,
    },
  })

  await db.todoItem.create({
    data: {
      userId: user.id,
      batchTaskId: id!,
      type: 'rerun_timeout',
      status: 'pending',
      dueAt: new Date(now.getTime() + task.timeoutMinutes * 60 * 1000),
    },
  })

  const result = await enqueueBatchTask(id!)
  if (!result.queued) {
    console.warn('[tasks/rerun] enqueue failed, fallback to local:', result.reason)
    setTimeout(() => processTaskFallback(id!), 1500)
  }

  return updated
})
