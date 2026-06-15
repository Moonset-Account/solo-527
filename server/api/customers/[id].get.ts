import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  if (!id) return errorResponse('无效的客户ID')

  const customer = await mockPrisma.customer.findUnique({ where: { id } })
  if (!customer) return errorResponse('客户不存在', 404)

  const [advisors, levels, channels, allTags, consults, consumptions, quotations, returnPlans, churnRecord] = await Promise.all([
    mockPrisma.advisor.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.sourceChannel.findMany(),
    mockPrisma.tag.findMany(),
    mockPrisma.consultRecord.findMany({ where: { customerId: id } }),
    mockPrisma.consumption.findMany({ where: { customerId: id } }),
    mockPrisma.quotation.findMany({ where: { customerId: id } }),
    mockPrisma.returnPlan.findMany({ where: { customerId: id } }),
    mockPrisma.churnRecord.findUnique({ where: { customerId: id } }),
  ])

  const tags = allTags.filter(t => customer.tagIds.includes(t.id))

  const quotationsWithDetails = quotations.map(q => ({
    ...q,
    advisor: advisors.find(a => a.id === q.advisorId) || null,
    responseNodes: q.responseNodes.map(node => ({
      ...node,
      owner: advisors.find(a => a.id === node.ownerId) || null,
    })),
  }))

  const returnPlansWithDetails = returnPlans.map(r => ({
    ...r,
    assignee: advisors.find(a => a.id === r.assigneeId) || null,
  }))

  const totalConsumption = consumptions.reduce((sum, c) => sum + parseFloat(c.amount), 0)
  const totalQuotationAmount = quotations
    .filter(q => q.status === 'ACCEPTED')
    .reduce((sum, q) => sum + parseFloat(q.totalAmount), 0)

  return successResponse({
    ...customer,
    advisor: advisors.find(a => a.id === customer.advisorId) || null,
    level: levels.find(l => l.id === customer.levelId) || null,
    sourceChannel: channels.find(ch => ch.id === customer.sourceChannelId) || null,
    tags,
    consults,
    consumptions,
    quotations: quotationsWithDetails,
    returnPlans: returnPlansWithDetails,
    churnRecord: churnRecord || null,
    stats: {
      totalConsumption: totalConsumption.toFixed(2),
      totalQuotationAmount: totalQuotationAmount.toFixed(2),
      consultCount: consults.length,
      consumptionCount: consumptions.length,
      quotationCount: quotations.length,
      acceptedQuotationCount: quotations.filter(q => q.status === 'ACCEPTED').length,
      pendingReturnPlanCount: returnPlans.filter(r => r.status === 'PENDING').length,
    }
  })
})
