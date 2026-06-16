import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { BillingStats, WorkOrderStats } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = 'stats:dashboard'
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      billsAgg,
      paidAgg,
      pendingAgg,
      overdueAgg,
      monthlyData,
      workOrderAgg,
    ] = await Promise.all([
      prisma.bill.aggregate({ _sum: { amount: true } }),
      prisma.bill.aggregate({ _sum: { paidAmount: true } }),
      prisma.bill.count({ where: { status: 'PENDING' } }),
      prisma.bill.count({ where: { status: 'OVERDUE' } }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("issueDate", 'YYYY-MM') as month,
          COALESCE(SUM(amount), 0)::float as billed,
          COALESCE(SUM("paidAmount"), 0)::float as paid
        FROM "Bill"
        WHERE "issueDate" >= ${sixMonthsAgo}
        GROUP BY TO_CHAR("issueDate", 'YYYY-MM')
        ORDER BY month
      ` as Promise<{ month: string; billed: number; paid: number }[]>,
      prisma.workOrder.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    const getWOCount = (status: string) =>
      workOrderAgg.find(g => g.status === status)?._count.status || 0

    const billingStats: BillingStats = {
      totalBilled: Number(billsAgg._sum.amount || 0),
      totalPaid: Number(paidAgg._sum.paidAmount || 0),
      totalPending: pendingAgg,
      totalOverdue: overdueAgg,
      monthlyData,
    }

    const workOrderStats: WorkOrderStats = {
      total: workOrderAgg.reduce((s, g) => s + g._count.status, 0),
      pending: getWOCount('PENDING'),
      inProgress: getWOCount('IN_PROGRESS') + getWOCount('ASSIGNED'),
      completed: getWOCount('COMPLETED'),
      overdue: getWOCount('OVERDUE'),
    }

    const result = { billingStats, workOrderStats }
    await cacheSet(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
