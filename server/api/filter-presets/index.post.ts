export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { name, page, filters } = body

  if (!name || !page || !filters) {
    throw createError({ statusCode: 400, message: '请填写完整筛选预设信息' })
  }

  const db = useDB()
  const preset = await db.filterPreset.create({
    data: {
      userId: user.id,
      name,
      page,
      filters: filters as any,
    },
  })

  return preset
})
