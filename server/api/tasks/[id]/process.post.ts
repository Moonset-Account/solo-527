export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()
  const { enqueueBatchTask, processTaskFallback } = await import('~/server/utils/queue')

  const task = await db.batchTask.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  if (task.status === 'generating' || task.status === 'completed') {
    return task
  }

  await db.batchTask.update({
    where: { id },
    data: {
      status: 'scheduled',
      scheduledAt: new Date(),
      startedAt: null,
      completedAt: null,
      completedItems: 0,
    },
  })

  const result = await enqueueBatchTask(id!)
  if (!result.queued) {
    console.warn('[tasks/process] enqueue failed, fallback to local:', result.reason)
    setTimeout(() => processTaskFallback(id!), 500)
  }

  return await db.batchTask.findUnique({ where: { id } })
})
