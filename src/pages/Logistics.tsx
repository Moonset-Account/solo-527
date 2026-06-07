import { useStore } from '@/store/useStore'
import { clickhouse } from '@/api/clickhouse'
import { supersetClient } from '@/api/superset'
import { pgMeta } from '@/api/postgresql'
import { AlertTriangle } from 'lucide-react'
import EChartsWrapper from '@/components/EChartsWrapper'
import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

function computeLinearRegression(data: { x: number; y: number }[]) {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: 0 }
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const { x, y } of data) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export default function Logistics() {
  const warehouseType = useStore((s) => s.warehouseType)

  const logisticsThreshold = useMemo(
    () => pgMeta.getLowSampleConfig().find((c) => c.dimension === 'logistics_node')?.threshold ?? 50,
    []
  )

  const logisticsData = useMemo(
    () => supersetClient.query(
      `logistics_${warehouseType}`,
      () => clickhouse.getLogisticsCorrelation(warehouseType, logisticsThreshold)
    ),
    [warehouseType, logisticsThreshold]
  )

  const rankedData = useMemo(() => {
    const normal = logisticsData.filter((d) => !d.isLowSample)
    const lowSample = logisticsData.filter((d) => d.isLowSample)
    return [...normal, ...lowSample]
  }, [logisticsData])

  const chartOption = useMemo<EChartsOption>(() => {
    const normalData = logisticsData.filter((d) => !d.isLowSample)
    const lowSampleData = logisticsData.filter((d) => d.isLowSample)

    const regression = computeLinearRegression(
      normalData.map((d) => ({ x: d.delayRate, y: d.returnRate }))
    )

    const xMin = 0
    const xMax = Math.max(...logisticsData.map((d) => d.delayRate), 40)

    const series: EChartsOption['series'] = [
      {
        name: '正常节点',
        type: 'scatter',
        data: normalData.map((d) => [d.delayRate, d.returnRate, d.orderCount, d.node, d.avgDelayHours]),
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 2,
        markLine: normalData.length >= 2 ? {
          silent: true,
          lineStyle: { type: 'dashed', color: '#999', width: 2 },
          data: [
            [
              { coord: [xMin, regression.slope * xMin + regression.intercept] },
              { coord: [xMax, regression.slope * xMax + regression.intercept] },
            ],
          ],
          label: { formatter: '趋势线', position: 'insideEndTop' },
        } : undefined,
      },
    ]

    if (lowSampleData.length > 0) {
      series.push({
        name: '低样本节点',
        type: 'scatter',
        data: lowSampleData.map((d) => [d.delayRate, d.returnRate, d.orderCount, d.node, d.avgDelayHours]),
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 2,
        itemStyle: { color: '#F5A623', opacity: 0.5 },
      })
    }

    return {
      tooltip: {
        formatter: (params: any) => {
          const [delayRate, returnRate, orderCount, node, avgDelay] = params.data
          const isLow = lowSampleData.some((d) => d.node === node)
          return `<strong>${node}</strong>${isLow ? ' <span style="color:#F5A623">[低样本]</span>' : ''}<br/>延误率: ${delayRate}%<br/>退货率: ${returnRate}%<br/>订单量: ${orderCount}<br/>平均延误时长: ${avgDelay}小时`
        },
      },
      legend: { data: lowSampleData.length > 0 ? ['正常节点', '低样本节点'] : ['正常节点'], top: 10 },
      grid: { left: 60, right: 40, top: 50, bottom: 60 },
      xAxis: {
        name: '延误率 (%)',
        nameLocation: 'middle',
        nameGap: 35,
        type: 'value',
        min: 0,
      },
      yAxis: {
        name: '退货率 (%)',
        type: 'value',
        min: 0,
      },
      visualMap: {
        min: 0,
        max: 40,
        dimension: 0,
        inRange: { color: ['#2ECB71', '#FF6B35'] },
        text: ['高延误', '低延误'],
        right: 10,
        top: 'center',
        itemWidth: 12,
        itemHeight: 120,
        seriesIndex: 0,
      },
      series,
    }
  }, [logisticsData])

  const tableRows = useMemo(() => {
    return rankedData
      .map((d) => ({
        ...d,
        impactIndex: +(d.delayRate * d.returnRate / 100).toFixed(2),
      }))
      .sort((a, b) => {
        if (a.isLowSample && !b.isLowSample) return 1
        if (!a.isLowSample && b.isLowSample) return -1
        return b.impactIndex - a.impactIndex
      })
  }, [rankedData])

  const maxImpact = useMemo(() => {
    const normalRows = tableRows.filter((r) => !r.isLowSample)
    return normalRows.length > 0 ? normalRows[0].impactIndex : (tableRows.length > 0 ? tableRows[0].impactIndex : 1)
  }, [tableRows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">物流延误关联分析</h1>
          <p className="mt-1 text-sm text-gray-500">
            分析物流节点延误率与退货率的关联关系 | 低样本阈值: {logisticsThreshold} 单 | 数据源: ClickHouse
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <EChartsWrapper option={chartOption} style={{ height: 420, width: '100%' }} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">延误节点退货归因</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">物流节点</th>
                <th className="pb-3 pr-4 font-medium">平均延误(小时)</th>
                <th className="pb-3 pr-4 font-medium">延误率</th>
                <th className="pb-3 pr-4 font-medium">退货率</th>
                <th className="pb-3 pr-4 font-medium">订单量</th>
                <th className="pb-3 font-medium">延误影响指数</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const isLow = row.isLowSample
                const color = isLow ? 'text-accent-yellow' : row.impactIndex > 5 ? 'text-accent-red' : row.impactIndex >= 2 ? 'text-accent-orange' : 'text-accent-green'
                const bgColor = isLow ? 'bg-accent-yellow' : row.impactIndex > 5 ? 'bg-accent-red' : row.impactIndex >= 2 ? 'bg-accent-orange' : 'bg-accent-green'
                const barWidth = isLow ? 0 : (row.impactIndex / maxImpact) * 100
                return (
                  <tr key={row.node} className={`border-b border-gray-100 ${isLow ? 'bg-yellow-50/30' : ''}`}>
                    <td className="py-3 pr-4 text-gray-800">
                      {row.node}
                      {isLow && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                          <AlertTriangle size={10} />
                          样本不足
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{row.avgDelayHours}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.delayRate}%</td>
                    <td className="py-3 pr-4 text-gray-600">{row.returnRate}%</td>
                    <td className="py-3 pr-4 text-gray-600">{row.orderCount}</td>
                    <td className="py-3">
                      {isLow ? (
                        <span className="text-xs text-yellow-600">不参与排名</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                            <div className={`h-full rounded ${bgColor} transition-all duration-300`} style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className={`min-w-[40px] text-right font-semibold ${color}`}>{row.impactIndex}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
