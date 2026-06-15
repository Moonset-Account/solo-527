import { mockPrisma, successResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const keyword = (query.keyword as string) || ''
  const tagIds = query.tagIds ? (query.tagIds as string).split(',').map(Number) : []
  const levelId = query.levelId ? parseInt(query.levelId as string) : null
  const advisorId = query.advisorId ? parseInt(query.advisorId as string) : null
  const leadQuality = (query.leadQuality as string) || null

  const where: any = {}
  if (keyword) {
    where.OR = [{ name: { contains: keyword } }, { phone: { contains: keyword } }]
  }
  if (levelId) where.levelId = levelId
  if (advisorId) where.advisorId = advisorId
  if (leadQuality) where.leadQuality = leadQuality

  let customers = await mockPrisma.customer.findMany({ where })

  if (tagIds.length > 0) {
    const customerTags = await mockPrisma.customerTag.findMany()
    const filteredCustomerIds = new Set<number>()
    for (const ct of customerTags) {
      if (tagIds.includes(ct.tagId)) {
        filteredCustomerIds.add(ct.customerId)
      }
    }
    customers = customers.filter(c => filteredCustomerIds.has(c.id))
  }

  const total = customers.length

  const start = (page - 1) * pageSize
  const list = customers.slice(start, start + pageSize)

  const [advisors, levels, channels, tags] = await Promise.all([
    mockPrisma.advisor.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.sourceChannel.findMany(),
    mockPrisma.tag.findMany(),
  ])

  const listWithRelations = list.map(c => {
    const customerTags = tags.filter(t => c.tagIds.includes(t.id))
    return {
      ...c,
      advisor: advisors.find(a => a.id === c.advisorId) || null,
      level: levels.find(l => l.id === c.levelId) || null,
      sourceChannel: channels.find(ch => ch.id === c.sourceChannelId) || null,
      tags: customerTags,
    }
  })

  return successResponse({
    list: listWithRelations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
})
