import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createLog } from '@/lib/logger'
import * as ExcelJS from 'exceljs'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { redis } from '@/lib/redis'

const EXPORT_RATE_LIMIT = 10
const EXPORT_RATE_WINDOW = 60

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `export:rate:${userId}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, EXPORT_RATE_WINDOW)
  }
  return count <= EXPORT_RATE_LIMIT
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateOk = await checkRateLimit(session.user.id)
    if (!rateOk) {
      return NextResponse.json(
        { error: '导出操作过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'bills'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const dateFilter: Record<string, unknown> = {}
    if (dateFrom && dateTo) {
      dateFilter.gte = new Date(dateFrom)
      dateFilter.lte = new Date(dateTo)
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = '公寓服务门户'
    workbook.created = new Date()

    let filename = ''

    if (type === 'bills') {
      filename = `账单报表_${formatDate(new Date())}.xlsx`
      const worksheet = workbook.addWorksheet('账单报表')
      worksheet.columns = [
        { header: '账单编号', key: 'billNo', width: 25 },
        { header: '房间号', key: 'unitNumber', width: 12 },
        { header: '账单类型', key: 'type', width: 15 },
        { header: '标题', key: 'title', width: 25 },
        { header: '应缴金额', key: 'amount', width: 12 },
        { header: '已缴金额', key: 'paidAmount', width: 12 },
        { header: '状态', key: 'status', width: 10 },
        { header: '出账日期', key: 'issueDate', width: 15 },
        { header: '截止日期', key: 'dueDate', width: 15 },
      ]

      const bills = await prisma.bill.findMany({
        where: { createdAt: dateFilter } as Record<string, unknown>,
        include: { apartment: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      })

      worksheet.addRows(
        bills.map(b => ({
          billNo: b.billNo,
          unitNumber: b.apartment.unitNumber,
          type: b.type,
          title: b.title,
          amount: formatCurrency(b.amount),
          paidAmount: formatCurrency(b.paidAmount),
          status: b.status,
          issueDate: formatDate(b.issueDate),
          dueDate: formatDate(b.dueDate),
        }))
      )
    } else if (type === 'workorders') {
      filename = `工单报表_${formatDate(new Date())}.xlsx`
      const worksheet = workbook.addWorksheet('工单报表')
      worksheet.columns = [
        { header: '工单编号', key: 'orderNo', width: 25 },
        { header: '房间号', key: 'unitNumber', width: 12 },
        { header: '类型', key: 'type', width: 12 },
        { header: '标题', key: 'title', width: 30 },
        { header: '优先级', key: 'priority', width: 10 },
        { header: '状态', key: 'status', width: 12 },
        { header: '是否超时', key: 'isOverdue', width: 10 },
        { header: '处理人', key: 'assignee', width: 15 },
        { header: '创建时间', key: 'createdAt', width: 20 },
      ]

      const orders = await prisma.workOrder.findMany({
        where: { createdAt: dateFilter } as Record<string, unknown>,
        include: { apartment: true, assignee: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      })

      worksheet.addRows(
        orders.map(o => ({
          orderNo: o.orderNo,
          unitNumber: o.apartment.unitNumber,
          type: o.type,
          title: o.title,
          priority: o.priority,
          status: o.status,
          isOverdue: o.isOverdue ? '是' : '否',
          assignee: o.assignee?.name || '未分配',
          createdAt: formatDateTime(o.createdAt),
        }))
      )
    } else if (type === 'payments') {
      filename = `缴费报表_${formatDate(new Date())}.xlsx`
      const worksheet = workbook.addWorksheet('缴费报表')
      worksheet.columns = [
        { header: '交易编号', key: 'transactionNo', width: 25 },
        { header: '账单编号', key: 'billNo', width: 25 },
        { header: '缴费人', key: 'userName', width: 15 },
        { header: '金额', key: 'amount', width: 12 },
        { header: '支付方式', key: 'method', width: 15 },
        { header: '缴费时间', key: 'paidAt', width: 20 },
      ]

      const payments = await prisma.payment.findMany({
        where: { paidAt: dateFilter } as Record<string, unknown>,
        include: { bill: true, user: true },
        orderBy: { paidAt: 'desc' },
        take: 5000,
      })

      worksheet.addRows(
        payments.map(p => ({
          transactionNo: p.transactionNo || '-',
          billNo: p.bill.billNo,
          userName: p.user.name || p.user.email,
          amount: formatCurrency(p.amount),
          method: p.method,
          paidAt: formatDateTime(p.paidAt),
        }))
      )
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    await createLog({
      userId: session.user.id,
      action: 'EXPORT',
      targetType: 'Report',
      targetId: type,
      detail: `导出${type}报表`,
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
