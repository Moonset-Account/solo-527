import { NextRequest, NextResponse } from 'next/server'
import { getExportData, getDefaultPermission } from '@/lib/services/dataService'
import type { FilterParams } from '@/lib/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { params, role = 'viewer', format = 'json' } = body

  const permission = getDefaultPermission(role as any)

  if (!permission.canExport) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const data = getExportData(params)

  if (format === 'csv') {
    const csvLines: string[] = []
    
    csvLines.push('=== 物流中转迟滞分析报告 ===')
    csvLines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    csvLines.push('')
    
    csvLines.push('=== 总体摘要 ===')
    csvLines.push('站点数,运单总数,迟滞运单数,迟滞率')
    csvLines.push(`${data.summary.totalStations},${data.summary.totalWaybills},${data.summary.totalDelayed},${(data.summary.overallDelayRate * 100).toFixed(1)}%`)
    csvLines.push('')

    csvLines.push('=== 站点详情 ===')
    csvLines.push('站点ID,站点名称,运单总数,迟滞运单数,平均停留时长(分钟),迟滞率,异常数')
    data.stations.forEach(s => {
      csvLines.push(`${s.stationId},${s.stationName},${s.totalWaybills},${s.delayedWaybills},${s.averageDurationMinutes.toFixed(1)},${(s.delayRate * 100).toFixed(1)}%,${s.exceptions}`)
    })
    csvLines.push('')

    csvLines.push('=== 路径详情 ===')
    csvLines.push('路径,起点,终点,运单数,迟滞数,平均迟滞(分钟)')
    data.paths.forEach(p => {
      csvLines.push(`${p.id},${p.originName},${p.destName},${p.waybillCount},${p.delayCount},${p.averageDelayMinutes.toFixed(1)}`)
    })

    const csvContent = csvLines.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="logistics_delay_report_${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ data, permission })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)

  if (!permission.canExport) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const params: FilterParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    stationIds: searchParams.get('stationIds')?.split(',').filter(Boolean) || undefined,
    vehicleIds: searchParams.get('vehicleIds')?.split(',').filter(Boolean) || undefined,
  }

  const data = getExportData(params)
  return NextResponse.json({ data, permission })
}
