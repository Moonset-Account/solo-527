import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getParetoData } from '@/api/aggregation'
import ChartContainer from './ChartContainer'
import type { ECElementEvent } from 'echarts'

export default function ParetoChart() {
  const filters = useFilterStore()
  const { setDrillDown } = useFilterStore()
  const paretoData = useMemo(() => getParetoData(filters), [filters])

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
      data: ['计划停机', '突发停机', '累计占比'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 60, right: 60, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: paretoData.map(d => d.faultType),
      axisLabel: { color: '#8b92ad', fontSize: 10, rotate: 20 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '时长(分钟)',
        nameTextStyle: { color: '#8b92ad', fontSize: 10 },
        axisLabel: { color: '#8b92ad', fontSize: 10 },
        splitLine: { lineStyle: { color: '#2f3654' } },
      },
      {
        type: 'value',
        name: '累计占比(%)',
        nameTextStyle: { color: '#8b92ad', fontSize: 10 },
        axisLabel: { color: '#8b92ad', fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false },
        max: 100,
      },
    ],
    series: [
      {
        name: '计划停机',
        type: 'bar',
        stack: 'total',
        data: paretoData.map(d => d.plannedDuration),
        itemStyle: { color: '#4a90d9', borderRadius: [0, 0, 0, 0] },
        barWidth: '40%',
      },
      {
        name: '突发停机',
        type: 'bar',
        stack: 'total',
        data: paretoData.map(d => d.unplannedDuration),
        itemStyle: { color: '#ff8c42', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '累计占比',
        type: 'line',
        yAxisIndex: 1,
        data: paretoData.map(d => d.cumulativePercent),
        smooth: true,
        lineStyle: { color: '#00e5c7', width: 2 },
        itemStyle: { color: '#00e5c7' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }), [paretoData])

  const handleClick = (params: ECElementEvent) => {
    if (params.componentType === 'series' && (params.seriesName === '计划停机' || params.seriesName === '突发停机')) {
      setDrillDown({ faultType: params.name as string, equipmentId: null, productionLine: null })
    }
  }

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">停机 Pareto 分析</h3>
      <ChartContainer option={option} height="320px" onChartClick={handleClick} />
    </div>
  )
}
