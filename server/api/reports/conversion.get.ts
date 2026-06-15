import { mockPrisma, successResponse } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const [channels, customers, quotations, advisors] = await Promise.all([
    mockPrisma.sourceChannel.findMany(),
    mockPrisma.customer.findMany(),
    mockPrisma.quotation.findMany(),
    mockPrisma.advisor.findMany(),
  ])

  const channelFunnel = channels.map(ch => {
    const channelCustomers = customers.filter(c => c.sourceChannelId === ch.id)
    const totalLeads = channelCustomers.length
    const withQuotation = channelCustomers.filter(c =>
      quotations.some(q => q.customerId === c.id)
    ).length
    const accepted = channelCustomers.filter(c =>
      quotations.some(q => q.customerId === c.id && q.status === 'ACCEPTED')
    ).length
    const converted = channelCustomers.filter(c =>
      parseFloat(c.totalConsumption) > 0
    ).length

    return {
      channelId: ch.id,
      channelName: ch.name,
      category: ch.category,
      totalLeads,
      withQuotation,
      accepted,
      converted,
      quotationRate: totalLeads > 0 ? Number(((withQuotation / totalLeads) * 100).toFixed(2)) : 0,
      acceptRate: withQuotation > 0 ? Number(((accepted / withQuotation) * 100).toFixed(2)) : 0,
      conversionRate: totalLeads > 0 ? Number(((converted / totalLeads) * 100).toFixed(2)) : 0,
    }
  })

  const expiredQuotations = quotations.filter(q => q.status === 'EXPIRED')

  const byReason: { reason: string; count: number; percentage: number }[] = []
  const reasonMap = new Map<string, number>()
  expiredQuotations.forEach(q => {
    const reason = q.expireReason || '未填写原因'
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1)
  })
  const totalExpired = expiredQuotations.length
  reasonMap.forEach((count, reason) => {
    byReason.push({
      reason,
      count,
      percentage: totalExpired > 0 ? Number(((count / totalExpired) * 100).toFixed(2)) : 0,
    })
  })
  byReason.sort((a, b) => b.count - a.count)

  const byOwner = advisors.map(a => {
    const advisorQuotations = quotations.filter(q => q.advisorId === a.id)
    const expired = advisorQuotations.filter(q => q.status === 'EXPIRED').length
    const total = advisorQuotations.length
    return {
      ownerId: a.id,
      ownerName: a.name,
      totalQuotations: total,
      expiredCount: expired,
      acceptedCount: advisorQuotations.filter(q => q.status === 'ACCEPTED').length,
      sentCount: advisorQuotations.filter(q => q.status === 'SENT').length,
      expireRate: total > 0 ? Number(((expired / total) * 100).toFixed(2)) : 0,
    }
  })

  const allNodes: any[] = []
  quotations.forEach(q => {
    q.responseNodes.forEach(node => {
      allNodes.push({
        quotationId: q.id,
        quotationStatus: q.status,
        quotationVersion: q.version,
        nodeId: node.id,
        nodeName: node.nodeName,
        ownerId: node.ownerId,
        ownerName: advisors.find(a => a.id === node.ownerId)?.name || '未知',
        dueAt: node.dueAt,
        doneAt: node.doneAt,
        isOverdue: !node.doneAt && new Date(node.dueAt) < new Date(),
        isCompleted: !!node.doneAt,
      })
    })
  })

  const responseNodes = {
    total: allNodes.length,
    completed: allNodes.filter(n => n.isCompleted).length,
    pending: allNodes.filter(n => !n.isCompleted).length,
    overdue: allNodes.filter(n => n.isOverdue).length,
    list: allNodes,
  }

  const summary = {
    totalLeads: customers.length,
    totalQuotations: quotations.length,
    expiredQuotations: totalExpired,
    acceptedQuotations: quotations.filter(q => q.status === 'ACCEPTED').length,
    overallConversionRate: customers.length > 0
      ? Number(((quotations.filter(q => q.status === 'ACCEPTED').length / customers.length) * 100).toFixed(2))
      : 0,
  }

  return successResponse({
    summary,
    channelFunnel,
    expireAnalysis: {
      total: totalExpired,
      byReason,
      byOwner,
    },
    responseNodes,
  })
})
