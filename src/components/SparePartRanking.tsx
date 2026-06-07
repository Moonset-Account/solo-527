import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getSparePartRanking } from '@/api/aggregation'
import ChartContainer from './ChartContainer'

export default function SparePartRanking() {
  const filters = useFilterStore()
  const data = useMemo(() => getSparePartRanking(filters), [filters])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1a1f36',
      borderColor: '#3d4568',
      textStyle: { color: '#e2e5f0', fontSize: 12 },
      formatter: (params: any) => {
        const d = params[0]
        const item = data[d.dataIndex]
        return `${d.name}<br/>消耗量: ${item.totalQuantity}<br/>消耗金额: ¥${item.totalCost.toLocaleString()}<br/>关联停机: ${item.associatedDowntimeCount}次`
      },
    },
    grid: { left: 120, right: 60, top: 20, bottom: 20 },
    xAxis: {
      type: 'value',
      name: '消耗金额(元)',
      nameTextStyle: { color: '#8b92ad', fontSize: 10 },
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2f3654' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.partName),
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.totalCost),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#00b89e' },
            { offset: 1, color: '#00e5c7' },
          ],
        },
        borderRadius: [0, 3, 3, 0],
      },
      barWidth: '60%',
      label: {
        show: true,
        position: 'right' as const,
        formatter: (p: any) => `¥${p.value.toLocaleString()}`,
        color: '#00e5c7',
        fontSize: 10,
      },
    }],
  }), [data])

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">备件消耗排行</h3>
      <ChartContainer option={option} height="300px" />
    </div>
  )
}
