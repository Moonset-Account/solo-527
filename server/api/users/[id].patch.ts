import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权限执行此操作' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)

  const result = await prisma.user.update({
    where: { id: String(id) },
    data: { isActive: body.isActive },
    select: { id: true, isActive: true }
  })

  return result
})
