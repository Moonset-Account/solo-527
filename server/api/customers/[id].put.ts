import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const body = await readBody(event)

  const updated = await mockPrisma.customer.update({ where: { id }, data: body })
  if (!updated) return errorResponse('客户不存在', 404)

  const [advisor, level, sourceChannel, allTags] = await Promise.all([
    mockPrisma.advisor.findUnique({ where: { id: updated.advisorId || 0 } }),
    mockPrisma.customerLevel.findUnique({ where: { id: updated.levelId || 0 } }),
    mockPrisma.sourceChannel.findUnique({ where: { id: updated.sourceChannelId } }),
    mockPrisma.tag.findMany(),
  ])

  const tags = allTags.filter(t => updated.tagIds.includes(t.id))

  return successResponse({
    ...updated,
    advisor: advisor || null,
    level: level || null,
    sourceChannel,
    tags,
  })
})
