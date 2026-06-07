import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getMaintenanceDurationDistribution } from '@/api/aggregation'
import ChartContainer from './ChartContainer'

export default function MaintenanceDistribution() {
  const filters = useFilterStore()
  const data = useMemo(() => getMaintenanceDurationDistribution(filters), [filters])

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
      data: ['计划检修', '突发停机'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.bin),
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    yAxis: {
      type: 'value',
      name: '工单数',
      nameTextStyle: { color: '#8b92ad', fontSize: 10 },
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2f3654' } },
    },
    series: [
      {
        name: '计划检修',
        type: 'bar',
        data: data.map(d => d.planned),
        itemStyle: { color: '#4a90d9', borderRadius: [2, 2, 0, 0] },
        barGap: '10%',
      },
      {
        name: '突发停机',
        type: 'bar',
        data: data.map(d => d.unplanned),
        itemStyle: { color: '#ff8c42', borderRadius: [2, 2, 0, 0] },
      },
    ],
  }), [data])

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">维修时长分布</h3>
      <ChartContainer option={option} height="280px" />
    </div>
  )
}
