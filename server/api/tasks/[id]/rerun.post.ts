export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  const updated = await db.batchTask.update({
    where: { id },
    data: {
      status: 'scheduled',
      completedItems: 0,
      scheduledAt: new Date(),
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
      dueAt: new Date(Date.now() + task.timeoutMinutes * 60 * 1000),
    },
  })

  setTimeout(async () => {
    try {
      await $fetch(`/api/tasks/${id}/process`, { method: 'POST' })
    } catch {}
  }, 1000)

  return updated
})
