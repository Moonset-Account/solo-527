import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getSparePartTrend } from '@/api/aggregation'
import ChartContainer from './ChartContainer'

export default function SparePartTrend() {
  const filters = useFilterStore()
  const data = useMemo(() => getSparePartTrend(filters), [filters])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1f36',
      borderColor: '#3d4568',
      textStyle: { color: '#e2e5f0', fontSize: 12 },
    },
    legend: {
      data: ['备件消耗金额', '停机时长'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 60, right: 60, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { color: '#8b92ad', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '消耗金额(元)',
        nameTextStyle: { color: '#8b92ad', fontSize: 10 },
        axisLabel: { color: '#8b92ad', fontSize: 10 },
        splitLine: { lineStyle: { color: '#2f3654' } },
      },
      {
        type: 'value',
        name: '停机时长(分钟)',
        nameTextStyle: { color: '#8b92ad', fontSize: 10 },
        axisLabel: { color: '#8b92ad', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '备件消耗金额',
        type: 'bar',
        data: data.map(d => d.consumption),
        itemStyle: { color: '#00e5c7', borderRadius: [2, 2, 0, 0] },
        barWidth: '60%',
      },
      {
        name: '停机时长',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.downtimeDuration),
        smooth: true,
        lineStyle: { color: '#ff8c42', width: 1.5 },
        itemStyle: { color: '#ff8c42' },
        symbol: 'none',
      },
    ],
    dataZoom: [{ type: 'inside' }],
  }), [data])

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">备件消耗与停机趋势对比</h3>
      <ChartContainer option={option} height="300px" />
    </div>
  )
}
