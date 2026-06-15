import { mockPrisma, successResponse } from '~/server/utils/prisma'
import type { LeadQuality } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const [customers, levels, advisors] = await Promise.all([
    mockPrisma.customer.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.advisor.findMany(),
  ])

  const qualities: LeadQuality[] = ['A', 'B', 'C', 'D']
  const qualityLabels: Record<LeadQuality, string> = {
    A: '优质线索',
    B: '良好线索',
    C: '一般线索',
    D: '低质线索',
  }

  const byQuality = qualities.map(q => {
    const count = customers.filter(c => c.leadQuality === q).length
    return {
      quality: q,
      label: qualityLabels[q],
      count,
      percentage: customers.length > 0 ? Number(((count / customers.length) * 100).toFixed(2)) : 0,
      totalConsumption: customers
        .filter(c => c.leadQuality === q)
        .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
        .toFixed(2),
      avgConsumption: count > 0
        ? (customers
            .filter(c => c.leadQuality === q)
            .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0) / count).toFixed(2)
        : '0.00',
    }
  })

  const byLevel = levels.map(l => {
    const levelCustomers = customers.filter(c => c.levelId === l.id)
    const count = levelCustomers.length
    return {
      levelId: l.id,
      levelName: l.name,
      threshold: l.threshold,
      count,
      percentage: customers.length > 0 ? Number(((count / customers.length) * 100).toFixed(2)) : 0,
      totalConsumption: levelCustomers
        .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
        .toFixed(2),
      avgConsumption: count > 0
        ? (levelCustomers.reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0) / count).toFixed(2)
        : '0.00',
      qualityDistribution: qualities.map(q => ({
        quality: q,
        label: qualityLabels[q],
        count: levelCustomers.filter(c => c.leadQuality === q).length,
      })),
    }
  })

  const byAdvisor = advisors.map(a => {
    const advisorCustomers = customers.filter(c => c.advisorId === a.id)
    const count = advisorCustomers.length
    return {
      advisorId: a.id,
      advisorName: a.name,
      role: a.role,
      customerCount: count,
      percentage: customers.length > 0 ? Number(((count / customers.length) * 100).toFixed(2)) : 0,
      totalConsumption: advisorCustomers
        .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
        .toFixed(2),
      avgConsumption: count > 0
        ? (advisorCustomers.reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0) / count).toFixed(2)
        : '0.00',
      avgVisitCount: count > 0
        ? Number((advisorCustomers.reduce((sum, c) => sum + c.visitCount, 0) / count).toFixed(1))
        : 0,
      qualityDistribution: qualities.map(q => ({
        quality: q,
        label: qualityLabels[q],
        count: advisorCustomers.filter(c => c.leadQuality === q).length,
        percentage: count > 0
          ? Number(((advisorCustomers.filter(c => c.leadQuality === q).length / count) * 100).toFixed(2))
          : 0,
      })),
      levelDistribution: levels.map(l => ({
        levelId: l.id,
        levelName: l.name,
        count: advisorCustomers.filter(c => c.levelId === l.id).length,
      })),
    }
  })

  const summary = {
    totalCustomers: customers.length,
    avgConsumption: customers.length > 0
      ? (customers.reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0) / customers.length).toFixed(2)
      : '0.00',
    totalConsumption: customers
      .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
      .toFixed(2),
    highQualityCount: customers.filter(c => c.leadQuality === 'A').length,
    qualityCustomerRatio: customers.length > 0
      ? Number(((customers.filter(c => c.leadQuality === 'A').length / customers.length) * 100).toFixed(2))
      : 0,
  }

  return successResponse({
    summary,
    byQuality,
    byLevel,
    byAdvisor,
  })
})
