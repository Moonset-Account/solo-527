export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const task = await db.batchTask.findUnique({ where: { id } })
  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' })
  }

  await db.batchTask.delete({ where: { id } })

  return { success: true }
})
