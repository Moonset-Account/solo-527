import ReactECharts from 'echarts-for-react'
import type { SparePartCorrelation } from '@/types'

interface SparePartCorrelationChartProps {
  data: SparePartCorrelation[]
}

export default function SparePartCorrelationChart({ data }: SparePartCorrelationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
        <span className="text-lg text-[#95A5A6]">暂无数据</span>
      </div>
    )
  }

  const maxCost = Math.max(...data.map((d) => d.totalCost), 1)

  const scatterData = data.map((d) => ({
    value: [d.downtimeMinutes, d.consumptionQuantity, d.frequency, d.totalCost],
    partName: d.partName,
    faultType: d.faultType,
  }))

  const top5ByCost = [...data]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5)

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '备件消耗与停机关联分析',
      left: 'left',
      top: 0,
      textStyle: { color: '#FFFFFF', fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0F1B2D',
      borderColor: '#1E3A5F',
      textStyle: { color: '#FFFFFF' },
      formatter: (params: { data: { partName: string; faultType: string; value: number[] } }) => {
        const d = params.data
        return `<div style="font-weight:600;margin-bottom:4px">${d.partName}</div>
<div>故障类型: ${d.faultType}</div>
<div>停机时长: ${d.value[0]} 分钟</div>
<div>消耗数量: ${d.value[1]}</div>
<div>频次: ${d.value[2]}</div>
<div>总费用: ¥${d.value[3].toLocaleString()}</div>`
      },
    },
    grid: { left: 60, right: 30, top: 50, bottom: 60 },
    xAxis: {
      type: 'value',
      name: '停机时长(分钟)',
      nameTextStyle: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#1E3A5F' } },
    },
    yAxis: {
      type: 'value',
      name: '消耗数量',
      nameTextStyle: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#1E3A5F' } },
    },
    visualMap: {
      show: true,
      min: 0,
      max: maxCost,
      dimension: 3,
      inRange: {
        color: ['#3498DB', '#FF6B35', '#E74C3C'],
      },
      text: ['高费用', '低费用'],
      textStyle: { color: '#94A3B8' },
      right: 0,
      top: 'middle',
      itemWidth: 12,
      itemHeight: 100,
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        symbolSize: (val: number[]) => Math.max(Math.sqrt(val[2]) * 10, 12),
        label: {
          show: true,
          formatter: (params: { data: { partName: string } }) => params.data.partName,
          position: 'top',
          color: '#94A3B8',
          fontSize: 10,
        },
        itemStyle: {
          borderColor: '#1E3A5F',
          borderWidth: 1,
          opacity: 0.85,
        },
      },
    ],
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex-1 min-w-0">
          <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="w-48 flex-shrink-0 overflow-y-auto">
          <div className="mb-3 text-sm font-semibold text-white">费用排名 Top 5</div>
          <div className="space-y-2">
            {top5ByCost.map((item, index) => (
              <div key={item.partName} className="flex items-center gap-2 rounded-lg border border-[#1E3A5F]/50 bg-[#0F1B2D]/50 px-2 py-1.5">
                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'bg-[#FF6B35] text-white' : 'bg-[#1E3A5F] text-[#94A3B8]'}`}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-white">{item.partName}</div>
                  <div className="text-xs text-[#FF6B35]">¥{item.totalCost.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
