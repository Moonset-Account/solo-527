export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少建议ID' })
  }

  const db = useDB()
  const body = await readBody(event)
  const { isHit } = body

  const suggestion = await db.replySuggestion.update({
    where: { id },
    data: {
      isHit: isHit ?? true,
      hitVerifiedBy: user.id,
    },
    include: { references: true, question: true },
  })

  return suggestion
})
