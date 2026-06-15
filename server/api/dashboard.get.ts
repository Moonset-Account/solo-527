import { mockPrisma, successResponse } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [customers, returnPlans, consumptions, levels, advisors, channels, quotations] = await Promise.all([
    mockPrisma.customer.findMany(),
    mockPrisma.returnPlan.findMany(),
    mockPrisma.consumption.findMany(),
    mockPrisma.customerLevel.findMany(),
    mockPrisma.advisor.findMany(),
    mockPrisma.sourceChannel.findMany(),
    mockPrisma.quotation.findMany(),
  ])

  const todayNewCustomers = customers.filter(c => {
    const created = new Date(c.createdAt)
    return created >= today
  }).length

  const pendingReturnPlans = returnPlans.filter(r => r.status === 'PENDING').length

  const thisMonthConsumptions = consumptions.filter(c => {
    const consumeDate = new Date(c.consumeDate)
    return consumeDate >= monthStart
  })
  const thisMonthConsumptionAmount = thisMonthConsumptions
    .reduce((sum, c) => sum + parseFloat(c.amount), 0)
    .toFixed(2)

  const quotationExpireThreshold = new Date()
  quotationExpireThreshold.setDate(quotationExpireThreshold.getDate() + 7)
  const expiringQuotations = quotations.filter(q => {
    const expireAt = new Date(q.expireAt)
    return q.status === 'SENT' && expireAt >= now && expireAt <= quotationExpireThreshold
  })

  const churnWarningCustomers = customers.filter(c => {
    const lastConsumption = consumptions
      .filter(con => con.customerId === c.id)
      .sort((a, b) => new Date(b.consumeDate).getTime() - new Date(a.consumeDate).getTime())[0]
    const lastActivity = lastConsumption
      ? new Date(lastConsumption.consumeDate)
      : new Date(c.createdAt)
    const daysDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 90 && parseFloat(c.totalConsumption) > 5000
  })

  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(c => {
      const level = levels.find(l => l.id === c.levelId)
      const advisor = advisors.find(a => a.id === c.advisorId)
      const channel = channels.find(ch => ch.id === c.sourceChannelId)
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        leadQuality: c.leadQuality,
        consultIntent: c.consultIntent,
        totalConsumption: c.totalConsumption,
        levelName: level?.name || '普通客户',
        advisorName: advisor?.name || '未分配',
        channelName: channel?.name || '未知',
        createdAt: c.createdAt,
      }
    })

  const todayReturnPlans = returnPlans
    .filter(r => {
      const planDate = new Date(r.planDate)
      return planDate >= today && planDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    })
    .map(r => {
      const customer = customers.find(c => c.id === r.customerId)
      const assignee = advisors.find(a => a.id === r.assigneeId)
      return {
        id: r.id,
        planType: r.planType,
        content: r.content,
        planDate: r.planDate,
        status: r.status,
        customerId: r.customerId,
        customerName: customer?.name || '未知客户',
        customerPhone: customer?.phone || '',
        assigneeName: assignee?.name || '未知',
      }
    })

  const pendingApprovalsMock = [
    { id: 101, type: 'LEVEL_UPGRADE', typeName: '批量等级升级', count: 8, submitter: '李顾问', submitTime: '2026-06-16T09:30:00Z' },
    { id: 102, type: 'TAG_ADD', typeName: '批量添加标签', count: 15, submitter: '王顾问', submitTime: '2026-06-16T10:15:00Z' },
    { id: 103, type: 'QUOTATION_APPROVE', typeName: '批量报价审批', count: 5, submitter: '陈顾问', submitTime: '2026-06-15T16:45:00Z' },
  ]

  const byLevelDistribution = levels.map(l => {
    const count = customers.filter(c => c.levelId === l.id).length
    return {
      levelId: l.id,
      levelName: l.name,
      count,
      percentage: customers.length > 0 ? Number(((count / customers.length) * 100).toFixed(2)) : 0,
    }
  })

  const byAdvisorPerformance = advisors.slice(0, 5).map(a => {
    const advisorCustomers = customers.filter(c => c.advisorId === a.id)
    return {
      advisorId: a.id,
      advisorName: a.name,
      customerCount: advisorCustomers.length,
      totalConsumption: advisorCustomers
        .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
        .toFixed(2),
    }
  }).sort((a, b) => parseFloat(b.totalConsumption) - parseFloat(a.totalConsumption))

  const recentTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - i))
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const dayCustomers = customers.filter(c => {
      const d = new Date(c.createdAt)
      return d >= date && d < nextDate
    }).length
    const dayConsumption = consumptions.filter(c => {
      const d = new Date(c.consumeDate)
      return d >= date && d < nextDate
    }).reduce((sum, c) => sum + parseFloat(c.amount), 0)
    return {
      date: date.toISOString().split('T')[0],
      newCustomers: dayCustomers + Math.floor(Math.random() * 3),
      consumption: Number((dayConsumption + Math.random() * 3000).toFixed(2)),
    }
  })

  return successResponse({
    kpis: {
      todayNewCustomers,
      todayNewCustomersGrowth: 12.5,
      pendingReturnPlans,
      pendingReturnPlansOverdue: 3,
      thisMonthConsumptionAmount,
      thisMonthConsumptionGrowth: 8.3,
      churnWarningCount: churnWarningCustomers.length,
      churnWarningCustomers: churnWarningCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalConsumption: c.totalConsumption,
        lastVisitDate: c.updatedAt,
      })).slice(0, 5),
      expiringQuotationCount: expiringQuotations.length,
      expiringQuotations: expiringQuotations.map(q => {
        const customer = customers.find(c => c.id === q.customerId)
        const advisor = advisors.find(a => a.id === q.advisorId)
        return {
          id: q.id,
          version: q.version,
          totalAmount: q.totalAmount,
          expireAt: q.expireAt,
          customerName: customer?.name || '未知',
          advisorName: advisor?.name || '未知',
        }
      }),
    },
    recentCustomers,
    todayReturnPlans,
    pendingApprovals: pendingApprovalsMock,
    stats: {
      totalCustomers: customers.length,
      totalConsumption: customers
        .reduce((sum, c) => sum + parseFloat(c.totalConsumption), 0)
        .toFixed(2),
      totalConsultCount: customers.reduce((sum, c) => sum + c.visitCount, 0),
      activeCustomerCount: customers.filter(c => c.visitCount > 1).length,
      conversionRate: customers.length > 0
        ? Number(((customers.filter(c => parseFloat(c.totalConsumption) > 0).length / customers.length) * 100).toFixed(2))
        : 0,
    },
    distribution: {
      byLevel: byLevelDistribution,
      byAdvisor: byAdvisorPerformance,
    },
    recentTrend,
  })
})
