export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { name, totalItems, timeoutMinutes, config, questions } = body

  if (!name) {
    throw createError({ statusCode: 400, message: '请填写任务名称' })
  }

  const db = useDB()
  const task = await db.batchTask.create({
    data: {
      name,
      status: 'pending',
      totalItems: totalItems || (questions?.length || 0),
      timeoutMinutes: timeoutMinutes || 30,
      config: config || {},
      createdBy: user.id,
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
      dueAt: new Date(Date.now() + (task.timeoutMinutes) * 60 * 1000),
    },
  })

  setTimeout(async () => {
    try {
      await $fetch(`/api/tasks/${task.id}/process`, { method: 'POST' })
    } catch {}
  }, 1000)

  return task
})
