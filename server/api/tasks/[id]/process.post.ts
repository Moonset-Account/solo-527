export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()
  const { enqueueBatchTask } = await import('~/server/utils/queue')

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

  try {
    await enqueueBatchTask(id!)
  } catch (e) {
    console.error('[tasks/process] enqueue failed:', e)
    throw createError({ statusCode: 500, message: '任务入队失败' })
  }

  return await db.batchTask.findUnique({ where: { id } })
})
