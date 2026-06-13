export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const preset = await db.filterPreset.findUnique({ where: { id } })
  if (!preset || preset.userId !== user.id) {
    throw createError({ statusCode: 404, message: '筛选预设不存在' })
  }

  await db.filterPreset.delete({ where: { id } })
  return { success: true }
})
