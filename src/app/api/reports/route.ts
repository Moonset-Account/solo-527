import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  generateDailyReport,
  getReportTrend,
  getCoverageByOwner,
  getExpireReasonStats,
  getKnowledgeByDate,
} from '@/lib/reports'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'trend'
    const days = parseInt(searchParams.get('days') || '7')

    const user = await getCurrentUser()

    let data: any

    switch (type) {
      case 'trend':
        data = await getReportTrend(days)
        break
      case 'coverage':
        data = await getCoverageByOwner()
        break
      case 'expire-reasons':
        data = await getExpireReasonStats()
        break
      case 'knowledge-by-date':
        data = await getKnowledgeByDate()
        break
      case 'summary':
        const [trend, coverage, expireReasons, knowledgeByDate] = await Promise.all([
          getReportTrend(days),
          getCoverageByOwner(),
          getExpireReasonStats(),
          getKnowledgeByDate(),
        ])
        
        const today = new Date()
        const todayReport = await prisma.dailyReport.findFirst({
          where: {
            date: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
            },
          },
        })

        const totalKnowledge = await prisma.knowledgeBase.count()
        const activeKnowledge = await prisma.knowledgeBase.count({
          where: { status: 'ACTIVE' },
        })
        const expiredKnowledge = await prisma.knowledgeBase.count({
          where: { status: 'EXPIRED' },
        })
        const pendingConversations = await prisma.conversation.count({
          where: { status: 'PENDING' },
        })
        const unresolvedRisks = await prisma.riskSample.count({
          where: { isResolved: false },
        })

        data = {
          trend,
          coverage,
          expireReasons,
          knowledgeByDate,
          todayReport,
          summary: {
            totalKnowledge,
            activeKnowledge,
            expiredKnowledge,
            pendingConversations,
            unresolvedRisks,
          },
        }
        break
      default:
        return NextResponse.json(
          { success: false, error: '无效的报表类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date } = body
    const user = await getCurrentUser()

    const reportDate = date ? new Date(date) : new Date()
    const report = await generateDailyReport(reportDate, user.id)

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
