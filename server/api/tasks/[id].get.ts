export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, displayName: true } },
      questions: {
        include: {
          suggestions: { include: { references: true } },
        },
      },
      todoItems: true,
    },
  })

  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  return task
})
