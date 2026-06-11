import { useMockStore, isDbAvailable } from '~/server/utils/mockData'
import XLSX from 'xlsx'
import { Buffer } from 'node:buffer'

function generateReportData(type: string, filters: Record<string, any>, store: ReturnType<typeof useMockStore>) {
  const rows: Record<string, any>[] = []
  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 86400000)
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date()

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1

  switch (type) {
    case 'occupancy': {
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 86400000)
        const dateStr = date.toISOString().split('T')[0]
        const totalRooms = store.rooms.length
        const occupied = Math.floor(Math.random() * (totalRooms - 1)) + 1
        const available = totalRooms - occupied
        rows.push({
          '日期': dateStr,
          '总房间数': totalRooms,
          '已入住': occupied,
          '可用房间': available,
          '入住率(%)': ((occupied / totalRooms) * 100).toFixed(1),
          '空置率(%)': ((available / totalRooms) * 100).toFixed(1),
        })
      }
      break
    }
    case 'conversion': {
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 86400000)
        const dateStr = date.toISOString().split('T')[0]
        const views = Math.floor(Math.random() * 500) + 100
        const bookings = Math.floor(Math.random() * views * 0.25) + 5
        const paidOrders = Math.floor(bookings * (0.7 + Math.random() * 0.25))
        rows.push({
          '日期': dateStr,
          '浏览量': views,
          '下单量': bookings,
          '支付订单数': paidOrders,
          '下单转化率(%)': ((bookings / views) * 100).toFixed(2),
          '支付转化率(%)': ((paidOrders / bookings) * 100).toFixed(2),
          '整体转化率(%)': ((paidOrders / views) * 100).toFixed(2),
        })
      }
      break
    }
    case 'revenue': {
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 86400000)
        const dateStr = date.toISOString().split('T')[0]
        const orderCount = Math.floor(Math.random() * 10) + 2
        const avgPrice = Math.floor(Math.random() * 300) + 300
        const total = orderCount * avgPrice
        rows.push({
          '日期': dateStr,
          '订单数': orderCount,
          '平均房价(元)': avgPrice,
          '房费收入(元)': total,
          '其他收入(元)': Math.floor(total * 0.1),
          '总收入(元)': Math.floor(total * 1.1),
        })
      }
      break
    }
    case 'refund': {
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 86400000)
        const dateStr = date.toISOString().split('T')[0]
        const totalOrders = Math.floor(Math.random() * 10) + 2
        const refundCount = Math.floor(Math.random() * 3)
        const refundAmount = refundCount * (Math.floor(Math.random() * 300) + 200)
        const refundRate = totalOrders > 0 ? ((refundCount / totalOrders) * 100).toFixed(2) : '0'
        rows.push({
          '日期': dateStr,
          '总订单数': totalOrders,
          '退款单数': refundCount,
          '退款金额(元)': refundAmount,
          '退款率(%)': refundRate,
        })
      }
      break
    }
    default:
      break
  }

  return rows
}

function getReportTypeName(type: string): string {
  const map: Record<string, string> = {
    occupancy: '入住率统计报表',
    conversion: '入住转化统计报表',
    revenue: '收入统计报表',
    refund: '退款统计报表',
  }
  return map[type] || '统计报表'
}

function getFilterLabel(filters: Record<string, any>): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = []
  const typeLabels: Record<string, string> = {
    occupancy: '入住率统计',
    conversion: '转化率统计',
    revenue: '收入统计',
    refund: '退款统计',
  }
  const roomTypeLabels: Record<string, string> = {
    KING: '大床房',
    TWIN: '双床房',
    FAMILY: '家庭房',
    SUITE: '套房',
  }
  const statusLabels: Record<string, string> = {
    PAID: '已支付',
    CHECKED_IN: '已入住',
    CHECKED_OUT: '已退房',
    REFUNDED: '已退款',
  }

  if (filters.reportType) result.push({ label: '报表类型', value: typeLabels[filters.reportType] || filters.reportType })
  if (filters.startDate) result.push({ label: '开始日期', value: filters.startDate })
  if (filters.endDate) result.push({ label: '结束日期', value: filters.endDate })
  if (filters.roomType) result.push({ label: '房型', value: roomTypeLabels[filters.roomType] || filters.roomType })
  if (filters.status) result.push({ label: '订单状态', value: statusLabels[filters.status] || filters.status })

  return result
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const type = body.type || 'occupancy'
  const filters = body.filters || {}
  const operatorName = body.operatorName || '管理员'

  const store = await isDbAvailable() ? null : useMockStore()

  const dataRows = generateReportData(type, filters, store!)
  const reportName = getReportTypeName(type)
  const filterLabels = getFilterLabel(filters)
  const generatedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

  const wb = XLSX.utils.book_new()

  const wsData = XLSX.utils.json_to_sheet(dataRows)
  wsData['!cols'] = dataRows.length > 0 && dataRows[0]
    ? Object.keys(dataRows[0]).map(() => ({ wch: 16 }))
    : [{ wch: 16 }]

  XLSX.utils.book_append_sheet(wb, wsData, reportName)

  const infoRows: Record<string, string>[] = [
    { '项目': '报表名称', '值': reportName },
    { '项目': '生成时间', '值': generatedAt },
    { '项目': '操作人', '值': operatorName },
    { '项目': '数据条数', '值': String(dataRows.length) },
    { '项目': '------', '值': '------' },
  ]

  filterLabels.forEach(f => {
    infoRows.push({ '项目': `筛选条件 - ${f.label}`, '值': f.value })
  })

  const wsInfo = XLSX.utils.json_to_sheet(infoRows)
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, '导出信息')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  const fileName = `${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
  setHeader(event, 'Content-Length', String(excelBuffer.length))
  setHeader(event, 'X-Report-Name', encodeURIComponent(reportName))
  setHeader(event, 'X-Generated-At', encodeURIComponent(generatedAt))
  setHeader(event, 'X-Operator', encodeURIComponent(operatorName))
  setHeader(event, 'X-Filter-Snapshot', encodeURIComponent(JSON.stringify(filters)))

  return excelBuffer
})
