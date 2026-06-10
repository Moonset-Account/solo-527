import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, generateOrderNo, paginate, dateToStr } from '../../utils/helpers'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'


const EXPORT_TYPES = ['bookings', 'checkins', 'tournaments', 'capacity', 'revenue', 'faults']

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w\u4e00-\u9fa5\-]/g, '_')
}

async function generateExcel(type: string, params: any, userId: number): Promise<string> {
  const exportDir = path.join(process.cwd(), 'public', 'exports')
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true })

  let data: any[] = []
  let headers: string[] = []
  let fileName = `${type}_${dateToStr(new Date())}`

  switch (type) {
    case 'bookings': {
      const date = params.date
      const where: any = {}
      if (date) {
        const d = new Date(date)
        where.bookingDate = { gte: new Date(dateToStr(d)), lt: new Date(dateToStr(new Date(d.getTime() + 86400000))) }
      }
      const list = await prisma.booking.findMany({
        where,
        include: {
          customer: { select: { realName: true, phone: true } },
          court: { select: { courtNumber: true, name: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { bookingDate: 'desc' }
      })
      headers = ['订单号', '客户姓名', '联系电话', '场地', '日期', '时段', '时长(分钟)', '原价', '实付', '状态', '支付状态', '备注']
      data = list.map(b => [
        b.orderNo,
        b.customer?.realName || '-',
        b.customer?.phone || '-',
        `${b.court?.courtNumber} ${b.court?.name}`,
        dateToStr(b.bookingDate),
        `${b.startTime}-${b.endTime}`,
        b.duration,
        Number(b.originalPrice),
        Number(b.paidAmount || 0),
        b.status,
        b.payments?.[0]?.status || '未支付',
        b.remark || ''
      ])
      if (date) fileName += `_${date}`
      break
    }
    case 'checkins': {
      const date = params.date
      const where: any = {}
      if (date) {
        where.checkInTime = { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) }
      }
      const list = await prisma.checkInRecord.findMany({
        where,
        include: {
          user: { select: { realName: true, phone: true } },
          court: { select: { courtNumber: true, name: true } },
          booking: { select: { orderNo: true } }
        },
        orderBy: { checkInTime: 'desc' }
      })
      headers = ['签到号', '预约单号', '用户', '电话', '场地', '签到时间', '签退时间', '状态', '方式']
      data = list.map(c => [
        c.checkInNo,
        c.booking?.orderNo || '-',
        c.user?.realName || '-',
        c.user?.phone || '-',
        c.court ? `${c.court.courtNumber} ${c.court.name}` : '-',
        c.checkInTime ? new Date(c.checkInTime).toLocaleString() : '-',
        c.checkOutTime ? new Date(c.checkOutTime).toLocaleString() : '-',
        c.status,
        c.method || '-'
      ])
      break
    }
    case 'capacity': {
      const list = await prisma.coachCapacityReport.findMany({
        include: { coach: { include: { user: { select: { realName: true } } } } },
        orderBy: { reportDate: 'desc' }
      })
      headers = ['教练', '周开始', '周结束', '计划产能(小时)', '实际使用', '总时长', '培训时长', '学员数', '收入', '设备故障影响(小时)', '利用率%']
      data = list.map(r => [
        r.coach?.user?.realName || '-',
        dateToStr(r.weekStart),
        dateToStr(r.weekEnd),
        r.plannedCapacity,
        r.actualUsed,
        Number(r.totalHours),
        Number(r.trainingHours),
        r.studentCount,
        Number(r.revenue),
        Number(r.faultAffectHours),
        Number(r.utilizationRate)
      ])
      break
    }
    case 'faults': {
      const list = await prisma.deviceFault.findMany({
        include: {
          reporter: { select: { realName: true } },
          handler: { select: { realName: true } },
          court: { select: { courtNumber: true } }
        },
        orderBy: { reportedAt: 'desc' }
      })
      headers = ['故障单号', '场地', '设备名称', '类型', '严重程度', '描述', '报修人', '处理人', '报修时间', '处理结果', '维修费用', '状态']
      data = list.map(f => [
        f.faultNo,
        f.court?.courtNumber || '-',
        f.deviceName,
        f.deviceType,
        f.faultLevel,
        f.description,
        f.reporter?.realName || '-',
        f.handler?.realName || '-',
        new Date(f.reportedAt).toLocaleString(),
        f.repairResult || '-',
        f.repairCost ? Number(f.repairCost) : 0,
        f.status
      ])
      break
    }
    case 'revenue': {
      const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().setDate(new Date().getDate() - 30))
      const endDate = params.endDate ? new Date(new Date(params.endDate).getTime() + 86400000) : new Date()
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: startDate, lt: endDate }, status: 'PAID' },
        include: { user: { select: { realName: true } } },
        orderBy: { createdAt: 'desc' }
      })
      headers = ['支付单号', '订单号', '用户', '金额', '支付方式', '支付时间', '摘要']
      data = payments.map(p => [
        p.paymentNo,
        p.bookingId || p.tournamentRegId || '-',
        p.user?.realName || '-',
        Number(p.paidAmount),
        p.method,
        p.paidAt ? new Date(p.paidAt).toLocaleString() : '-',
        p.subject || ''
      ])
      const total = payments.reduce((s, p) => s + Number(p.paidAmount), 0)
      data.push(['合计', '', '', total, '', '', ''])
      break
    }
    case 'tournaments': {
      const list = await prisma.tournament.findMany({ orderBy: { startDate: 'desc' } })
      headers = ['赛事名称', '类型', '级别', '开始日期', '结束日期', '报名截止', '已报名/人数上限', '报名费', '奖金池', '状态']
      data = list.map(t => [
        t.name,
        t.formatType || '-',
        t.level || '-',
        dateToStr(t.startDate),
        dateToStr(t.endDate),
        new Date(t.regDeadline).toLocaleString(),
        `${t.currentPlayers}/${t.maxPlayers}`,
        Number(t.registrationFee),
        Number(t.prizePool),
        t.status
      ])
      break
    }
  }

  const safeFileName = sanitizeFileName(fileName)
  const filePath = path.join(exportDir, `${safeFileName}_${generateOrderNo('EX')}.xlsx`)

  const wsData = [headers, ...data]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = headers.map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, type)
  XLSX.writeFile(wb, filePath)

  return `/exports/${path.basename(filePath)}`
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const method = event.method
    const query = getQuery(event)

    if (method === 'GET') {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 20
      const status = query.status

      const where: any = { userId: auth.id }
      if (status) where.status = status

      const result = await paginate(
        prisma.downloadTask, page, pageSize, where,
        undefined,
        { createdAt: 'desc' }
      )
      return successResponse(result)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const { type, params, name } = body

      if (!EXPORT_TYPES.includes(type)) return errorResponse('不支持的导出类型', 400)

      const taskNo = generateOrderNo('DL')
      const task = await prisma.downloadTask.create({
        data: {
          taskNo,
          userId: auth.id,
          name: name || `导出-${type}-${new Date().toLocaleDateString()}`,
          type,
          params: params ? JSON.stringify(params) : null,
          status: 'PROCESSING',
          expireAt: new Date(new Date().getTime() + 7 * 86400000)
        }
      })

      try {
        const fileUrl = await generateExcel(type, params || {}, auth.id)
        await prisma.downloadTask.update({
          where: { id: task.id },
          data: {
            fileUrl,
            status: 'READY',
            completedAt: new Date()
          }
        })

        await prisma.notification.create({
          data: {
            userId: auth.id,
            type: 'SYSTEM_NOTICE',
            title: '导出文件已就绪',
            content: `您申请的导出任务 [${task.name}] 已处理完成，点击下载`,
            relatedId: task.id,
            relatedType: 'DownloadTask',
            canDownload: true,
            downloadId: task.id
          }
        })

        return successResponse({ id: task.id, taskNo, name: task.name, status: 'READY', fileUrl }, '导出成功')
      } catch (err: any) {
        await prisma.downloadTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', errorMsg: err.message || '导出失败' }
        })
        return errorResponse(err.message || '导出失败', 500)
      }
    }

    return errorResponse('不支持的方法', 405)
  } catch (e: any) {
    return errorResponse(e.message || '操作失败', 500)
  }
})
