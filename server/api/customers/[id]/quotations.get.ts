import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const [quotations, advisors] = await Promise.all([
    mockPrisma.quotation.findMany({ where: { customerId: id } }),
    mockPrisma.advisor.findMany(),
  ])

  const list = quotations.map(q => ({
    ...q,
    advisor: advisors.find(a => a.id === q.advisorId) || null,
    responseNodes: q.responseNodes.map(node => ({
      ...node,
      owner: advisors.find(a => a.id === node.ownerId) || null,
    })),
  }))

  return successResponse({
    list,
    total: list.length,
  })
})
