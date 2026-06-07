import { useStore } from '@/store/useStore'
import { generateLogisticsCorrelation } from '@/mock/data'
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

  const logisticsData = useMemo(
    () => generateLogisticsCorrelation(warehouseType),
    [warehouseType]
  )

  const chartOption = useMemo<EChartsOption>(() => {
    const scatterData = logisticsData.map((d) => [d.delayRate, d.returnRate, d.orderCount, d.node, d.avgDelayHours])

    const regression = computeLinearRegression(
      logisticsData.map((d) => ({ x: d.delayRate, y: d.returnRate }))
    )

    const xMin = 0
    const xMax = Math.max(...logisticsData.map((d) => d.delayRate), 40)

    return {
      tooltip: {
        formatter: (params: any) => {
          const [delayRate, returnRate, orderCount, node, avgDelay] = params.data
          return `<strong>${node}</strong><br/>延误率: ${delayRate}%<br/>退货率: ${returnRate}%<br/>订单量: ${orderCount}<br/>平均延误时长: ${avgDelay}小时`
        },
      },
      grid: { left: 60, right: 40, top: 40, bottom: 60 },
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
      },
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: (val: number[]) => Math.sqrt(val[2]) * 2,
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed', color: '#999', width: 2 },
            data: [
              [
                { coord: [xMin, regression.slope * xMin + regression.intercept] },
                { coord: [xMax, regression.slope * xMax + regression.intercept] },
              ],
            ],
            label: { formatter: '趋势线', position: 'insideEndTop' },
          },
        },
      ],
    }
  }, [logisticsData])

  const tableRows = useMemo(() => {
    return logisticsData
      .map((d) => ({
        ...d,
        impactIndex: +(d.delayRate * d.returnRate / 100).toFixed(2),
      }))
      .sort((a, b) => b.impactIndex - a.impactIndex)
  }, [logisticsData])

  const maxImpact = tableRows.length > 0 ? tableRows[0].impactIndex : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">物流延误关联分析</h1>
        <p className="mt-1 text-sm text-gray-500">分析物流节点延误率与退货率的关联关系</p>
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
                const color = row.impactIndex > 5 ? 'text-accent-red' : row.impactIndex >= 2 ? 'text-accent-orange' : 'text-accent-green'
                const bgColor = row.impactIndex > 5 ? 'bg-accent-red' : row.impactIndex >= 2 ? 'bg-accent-orange' : 'bg-accent-green'
                const barWidth = (row.impactIndex / maxImpact) * 100
                return (
                  <tr key={row.node} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-800">{row.node}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.avgDelayHours}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.delayRate}%</td>
                    <td className="py-3 pr-4 text-gray-600">{row.returnRate}%</td>
                    <td className="py-3 pr-4 text-gray-600">{row.orderCount}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                          <div className={`h-full rounded ${bgColor} transition-all duration-300`} style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className={`min-w-[40px] text-right font-semibold ${color}`}>{row.impactIndex}</span>
                      </div>
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
