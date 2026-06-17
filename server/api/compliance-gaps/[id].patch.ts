import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const { status, resolution, resolverId } = body

  const gap = await prisma.complianceGap.findUnique({ where: { id: String(id) } })
  if (!gap) {
    throw createError({ statusCode: 404, message: '合规缺口不存在' })
  }

  const updated = await prisma.complianceGap.update({
    where: { id: String(id) },
    data: {
      status: status || gap.status,
      resolution: resolution !== undefined ? resolution : gap.resolution,
      resolverId: resolverId || gap.resolverId,
      resolvedAt: (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : gap.resolvedAt
    }
  })

  return updated
})
