export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const db = useDB()

  const where: any = { userId: user.id }
  if (query.page) where.page = query.page as string

  const presets = await db.filterPreset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return presets
})
