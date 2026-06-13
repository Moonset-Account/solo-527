export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const todo = await db.todoItem.findUnique({ where: { id } })
  if (!todo || todo.userId !== user.id) {
    throw createError({ statusCode: 404, message: '待办不存在' })
  }

  const updated = await db.todoItem.update({
    where: { id },
    data: { status: 'done' },
    include: { batchTask: { select: { id: true, name: true } } },
  })

  return updated
})
