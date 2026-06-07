import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getProductionLineComparison } from '@/api/aggregation'
import ChartContainer from './ChartContainer'
import type { ECElementEvent } from 'echarts'

export default function ProductionLineComparison() {
  const filters = useFilterStore()
  const { setDrillDown } = useFilterStore()
  const data = useMemo(() => getProductionLineComparison(filters), [filters])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1a1f36',
      borderColor: '#3d4568',
      textStyle: { color: '#e2e5f0', fontSize: 12 },
    },
    legend: {
      data: ['计划停机', '突发停机'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      name: '时长(分钟)',
      nameTextStyle: { color: '#8b92ad', fontSize: 10 },
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2f3654' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.line),
      axisLabel: { color: '#8b92ad', fontSize: 11 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    series: [
      {
        name: '计划停机',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.plannedDuration),
        itemStyle: { color: '#4a90d9', borderRadius: [0, 0, 0, 0] },
        barWidth: '50%',
      },
      {
        name: '突发停机',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.unplannedDuration),
        itemStyle: { color: '#ff8c42', borderRadius: [0, 2, 2, 0] },
      },
    ],
  }), [data])

  const handleClick = (params: ECElementEvent) => {
    if (params.componentType === 'series') {
      setDrillDown({ faultType: null, equipmentId: null, productionLine: params.name as string })
    }
  }

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">产线停机对比</h3>
      <ChartContainer option={option} height="280px" onChartClick={handleClick} />
    </div>
  )
}
