import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useAnnotationStore } from '@/store/annotationStore'
import { getTrendData } from '@/api/aggregation'
import ChartContainer from './ChartContainer'
import type { ECElementEvent } from 'echarts'

interface TrendChartProps {
  onPointClick?: (date: string) => void
}

export default function TrendChart({ onPointClick }: TrendChartProps) {
  const filters = useFilterStore()
  const annotations = useAnnotationStore(s => s.annotations)
  const trendData = useMemo(() => getTrendData(filters), [filters])

  const markPoints = useMemo(() => {
    return annotations
      .filter(a => trendData.some(t => t.date === a.date))
      .map(a => ({
        name: a.content.slice(0, 10),
        coord: [a.date, trendData.find(t => t.date === a.date)?.totalDuration || 0],
        value: a.content.slice(0, 8) + '...',
        itemStyle: { color: '#ff6b4a' },
      }))
  }, [annotations, trendData])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1f36',
      borderColor: '#3d4568',
      textStyle: { color: '#e2e5f0', fontSize: 12 },
    },
    legend: {
      data: ['计划停机', '突发停机'],
      top: 0,
      textStyle: { color: '#8b92ad', fontSize: 11 },
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date),
      axisLabel: { color: '#8b92ad', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#3d4568' } },
    },
    yAxis: {
      type: 'value',
      name: '时长(分钟)',
      nameTextStyle: { color: '#8b92ad', fontSize: 10 },
      axisLabel: { color: '#8b92ad', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2f3654' } },
    },
    series: [
      {
        name: '计划停机',
        type: 'line',
        data: trendData.map(d => d.plannedDuration),
        smooth: true,
        lineStyle: { color: '#4a90d9', width: 1.5 },
        itemStyle: { color: '#4a90d9' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(74,144,217,0.3)' }, { offset: 1, color: 'rgba(74,144,217,0)' }] } },
        symbol: 'none',
      },
      {
        name: '突发停机',
        type: 'line',
        data: trendData.map(d => d.unplannedDuration),
        smooth: true,
        lineStyle: { color: '#ff8c42', width: 1.5 },
        itemStyle: { color: '#ff8c42' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,140,66,0.3)' }, { offset: 1, color: 'rgba(255,140,66,0)' }] } },
        symbol: 'none',
        markPoint: markPoints.length > 0 ? { data: markPoints, symbol: 'pin', symbolSize: 40, label: { show: true, fontSize: 8, color: '#fff' } } : undefined,
      },
    ],
    dataZoom: [{ type: 'inside' }],
  }), [trendData, markPoints])

  const handleClick = (params: ECElementEvent) => {
    if (onPointClick && params.componentType === 'series') {
      onPointClick(params.name as string)
    }
  }

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">停机趋势</h3>
      <ChartContainer option={option} height="300px" onChartClick={handleClick} />
    </div>
  )
}
