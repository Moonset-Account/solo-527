import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getMaintenancePersonStats } from '@/api/aggregation'
import ChartContainer from './ChartContainer'

export default function MaintenancePersonChart() {
  const filters = useFilterStore()
  const data = useMemo(() => getMaintenancePersonStats(filters).sort((a, b) => b.orderCount - a.orderCount), [filters])

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
      data: ['计划工单', '突发工单'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      name: '工单数',
      nameTextStyle: { color: '#8b92ad', fontSize: 10 },
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2f3654' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.person),
      axisLabel: { color: '#8b92ad', fontSize: 11 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    series: [
      {
        name: '计划工单',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.plannedCount),
        itemStyle: { color: '#4a90d9' },
        barWidth: '50%',
      },
      {
        name: '突发工单',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.unplannedCount),
        itemStyle: { color: '#ff8c42', borderRadius: [0, 2, 2, 0] },
      },
    ],
  }), [data])

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">维修人工单排名</h3>
      <ChartContainer option={option} height="280px" />
    </div>
  )
}
