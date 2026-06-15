import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || !body.phone || !body.sourceChannelId) {
    return errorResponse('缺少必填字段：name, phone, sourceChannelId')
  }

  const existingCustomers = await mockPrisma.customer.findMany()
  if (existingCustomers.some(c => c.phone === body.phone)) {
    return errorResponse('该手机号已存在')
  }

  const customer = await mockPrisma.customer.create({ data: body })

  const [advisor, level, sourceChannel, allTags] = await Promise.all([
    mockPrisma.advisor.findUnique({ where: { id: customer.advisorId || 0 } }),
    mockPrisma.customerLevel.findUnique({ where: { id: customer.levelId || 0 } }),
    mockPrisma.sourceChannel.findUnique({ where: { id: customer.sourceChannelId } }),
    mockPrisma.tag.findMany(),
  ])

  const tags = allTags.filter(t => customer.tagIds.includes(t.id))

  return successResponse({
    ...customer,
    advisor: advisor || null,
    level: level || null,
    sourceChannel,
    tags,
  })
})
