export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { enqueueBatchTask, processTaskFallback } = await import('~/server/utils/queue')
  const body = await readBody(event)
  const { name, totalItems, timeoutMinutes, config, questions } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '请填写任务名称' })
  }

  const db = useDB()
  const now = new Date()
  const task = await db.batchTask.create({
    data: {
      name,
      status: 'scheduled',
      totalItems: totalItems || (questions?.length || 0),
      timeoutMinutes: timeoutMinutes || 30,
      config: config || {},
      createdBy: user.id,
      scheduledAt: now,
    },
  })

  if (questions && questions.length > 0) {
    await db.question.createMany({
      data: questions.map((q: any) => ({
        content: q.content,
        templateVars: q.templateVars || null,
        batchTaskId: task.id,
        createdBy: user.id,
      })),
    })
  }

  await db.todoItem.create({
    data: {
      userId: user.id,
      batchTaskId: task.id,
      type: 'review',
      status: 'pending',
      dueAt: new Date(now.getTime() + task.timeoutMinutes * 60 * 1000),
    },
  })

  const result = await enqueueBatchTask(task.id)
  if (!result.queued) {
    console.warn('[tasks] enqueue failed, running local fallback immediately:', result.reason)
    processTaskFallback(task.id)
  }

  return task
})
