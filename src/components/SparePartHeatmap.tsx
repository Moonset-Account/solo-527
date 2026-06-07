import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getSparePartFaultMatrix } from '@/api/aggregation'
import ChartContainer from './ChartContainer'

export default function SparePartHeatmap() {
  const filters = useFilterStore()
  const matrix = useMemo(() => getSparePartFaultMatrix(filters), [filters])

  const maxVal = useMemo(() => Math.max(...matrix.values.flat(), 1), [matrix])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1a1f36',
      borderColor: '#3d4568',
      textStyle: { color: '#e2e5f0', fontSize: 12 },
      formatter: (params: any) => `${params.name}<br/>${matrix.faultTypes[params.value[0]]}: ${params.value[2]}`,
    },
    grid: { left: 120, right: 40, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: matrix.faultTypes,
      axisLabel: { color: '#8b92ad', fontSize: 9, rotate: 30 },
      axisLine: { lineStyle: { color: '#3d4568' } },
      splitArea: { show: true, areaStyle: { color: ['rgba(45,54,84,0.3)', 'rgba(45,54,84,0.1)'] } },
    },
    yAxis: {
      type: 'category',
      data: matrix.partNames,
      axisLabel: { color: '#8b92ad', fontSize: 9 },
      axisLine: { lineStyle: { color: '#3d4568' } },
      splitArea: { show: true, areaStyle: { color: ['rgba(45,54,84,0.3)', 'rgba(45,54,84,0.1)'] } },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: '#8b92ad', fontSize: 10 },
      inRange: { color: ['#1a1f36', '#005f52', '#00b89e', '#00e5c7'] },
    },
    series: [{
      type: 'heatmap',
      data: matrix.values.flatMap((row, yIdx) =>
        row.map((val, xIdx) => [xIdx, yIdx, val])
      ),
      label: {
        show: true,
        color: '#e2e5f0',
        fontSize: 9,
        formatter: (p: any) => p.value[2] || '',
      },
      itemStyle: { borderWidth: 2, borderColor: '#0f1225' },
    }],
  }), [matrix, maxVal])

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">备件 × 故障类型 热力图</h3>
      <ChartContainer option={option} height="350px" />
    </div>
  )
}
