import { NextRequest, NextResponse } from 'next/server'
import { getExportData, getDefaultPermission, getDataMode } from '@/lib/services/dataService'
import type { FilterParams } from '@/lib/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { params, role = 'viewer', format = 'json' } = body

  const permission = getDefaultPermission(role as any)

  if (!permission.canExport) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const data = await getExportData(params)
  const useDb = getDataMode()

  if (format === 'csv') {
    const csvLines: string[] = []
    
    csvLines.push('=== 物流中转迟滞分析报告 ===')
    csvLines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
    csvLines.push(`数据源: ${useDb ? 'PostgreSQL + PostGIS' : '模拟数据 (内存)'}`)
    csvLines.push('')
    
    csvLines.push('=== 筛选条件 ===')
    if (params.startDate) csvLines.push(`开始日期: ${params.startDate}`)
    if (params.endDate) csvLines.push(`结束日期: ${params.endDate}`)
    if (params.stationIds?.length) csvLines.push(`站点: ${params.stationIds.join(', ')}`)
    if (params.vehicleIds?.length) csvLines.push(`车辆: ${params.vehicleIds.join(', ')}`)
    if (params.teamIds?.length) csvLines.push(`装卸队: ${params.teamIds.join(', ')}`)
    if (params.delayCategories?.length) csvLines.push(`迟滞原因: ${params.delayCategories.join(', ')}`)
    if (params.minDelayMinutes) csvLines.push(`最小迟滞时长: ${params.minDelayMinutes}分钟`)
    if (params.spatialBounds) {
      csvLines.push(`空间范围 (WGS84): [${params.spatialBounds.minLng.toFixed(4)}, ${params.spatialBounds.minLat.toFixed(4)}] - [${params.spatialBounds.maxLng.toFixed(4)}, ${params.spatialBounds.maxLat.toFixed(4)}]`)
      csvLines.push(`空间筛选说明: 仅包含该矩形范围内的中转站数据`)
    }
    csvLines.push('')
    
    csvLines.push('=== 总体摘要 ===')
    csvLines.push('站点数,运单总数,迟滞运单数,迟滞率')
    csvLines.push(`${data.summary.totalStations},${data.summary.totalWaybills},${data.summary.totalDelayed},${(data.summary.overallDelayRate * 100).toFixed(1)}%`)
    csvLines.push('')

    csvLines.push('=== 站点详情 ===')
    csvLines.push('站点ID,站点名称,经度,纬度,运单总数,迟滞运单数,平均停留时长(分钟),迟滞率,异常数,天气标签')
    data.stations.forEach((s: any) => {
      csvLines.push(`${s.stationId},${s.stationName},${s.location.lng.toFixed(4)},${s.location.lat.toFixed(4)},${s.totalWaybills},${s.delayedWaybills},${s.averageDurationMinutes.toFixed(1)},${(s.delayRate * 100).toFixed(1)}%,${s.exceptions},"${(s.weatherConditions || []).join('; ')}"`)
    })
    csvLines.push('')

    csvLines.push('=== 路径详情 ===')
    csvLines.push('路径ID,起点,终点,运单数,迟滞数,平均停留(分钟),平均晚点(分钟),主要原因')
    data.paths.forEach((p: any) => {
      const reasons = (p.topReasons || []).map((r: any) => `${r.category}:${r.count}`).join('; ')
      csvLines.push(`${p.id},${p.originName},${p.destName},${p.waybillCount},${p.delayCount},${p.averageDurationMinutes.toFixed(1)},${p.averageDelayMinutes.toFixed(1)},"${reasons}"`)
    })
    csvLines.push('')

    csvLines.push('=== 装卸队绩效 ===')
    csvLines.push('装卸队ID,名称,所属站点,处理单数,迟滞单数,迟滞率,平均停留(分钟),样本量状态')
    data.teamPerformance.forEach((t: any) => {
      csvLines.push(`${t.teamId},${t.teamName},${t.stationName},${t.totalWaybills},${t.delayedWaybills},${(t.delayRate * 100).toFixed(1)}%,${t.averageDurationMinutes.toFixed(1)},${t.isLowSample ? '样本不足' : '正常'}`)
    })

    const csvContent = csvLines.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="logistics_delay_report_${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ data, permission, dataSource: useDb ? 'postgis' : 'mock' })
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
    spatialBounds: searchParams.get('minLng') ? {
      minLng: Number(searchParams.get('minLng')),
      maxLng: Number(searchParams.get('maxLng')),
      minLat: Number(searchParams.get('minLat')),
      maxLat: Number(searchParams.get('maxLat')),
    } : undefined,
  }

  const data = await getExportData(params)
  return NextResponse.json({ data, permission, dataSource: getDataMode() ? 'postgis' : 'mock' })
}
