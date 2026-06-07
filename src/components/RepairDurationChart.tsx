import ReactECharts from 'echarts-for-react'
import type { RepairDurationDistribution } from '@/types'

interface RepairDurationChartProps {
  data: RepairDurationDistribution[]
}

export default function RepairDurationChart({ data }: RepairDurationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
        <span className="text-lg text-[#95A5A6]">暂无数据</span>
      </div>
    )
  }

  const aggregated = new Map<string, { median: number[]; p75: number[]; p95: number[] }>()
  data.forEach((item) => {
    if (!aggregated.has(item.faultType)) {
      aggregated.set(item.faultType, { median: [], p75: [], p95: [] })
    }
    const entry = aggregated.get(item.faultType)!
    entry.median.push(item.median)
    entry.p75.push(item.p75)
    entry.p95.push(item.p95)
  })

  const faultTypes = Array.from(aggregated.keys())
  const medianData = faultTypes.map((ft) => {
    const arr = aggregated.get(ft)!.median
    return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
  })
  const p75Data = faultTypes.map((ft) => {
    const arr = aggregated.get(ft)!.p75
    return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
  })
  const p95Data = faultTypes.map((ft) => {
    const arr = aggregated.get(ft)!.p95
    return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
  })

  const top5 = faultTypes
    .map((ft, i) => ({ faultType: ft, median: medianData[i] }))
    .sort((a, b) => b.median - a.median)
    .slice(0, 5)

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '维修时长分布分析',
      left: 'left',
      top: 0,
      textStyle: { color: '#FFFFFF', fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0F1B2D',
      borderColor: '#1E3A5F',
      textStyle: { color: '#FFFFFF' },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#94A3B8' },
      data: ['中位数', 'P75', 'P95'],
    },
    grid: { left: 60, right: 30, top: 50, bottom: 60 },
    xAxis: {
      type: 'category',
      data: faultTypes,
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8', rotate: 30, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '维修时长(分钟)',
      nameTextStyle: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#1E3A5F' } },
    },
    series: [
      {
        name: '中位数',
        type: 'bar',
        data: medianData,
        itemStyle: { color: '#3498DB', borderRadius: [4, 4, 0, 0] },
        barGap: '10%',
      },
      {
        name: 'P75',
        type: 'bar',
        data: p75Data,
        itemStyle: { color: '#FF6B35', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'P95',
        type: 'bar',
        data: p95Data,
        itemStyle: { color: '#E74C3C', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E3A5F]">
              <th className="px-3 py-2 text-left text-[#94A3B8]">排名</th>
              <th className="px-3 py-2 text-left text-[#94A3B8]">故障类型</th>
              <th className="px-3 py-2 text-right text-[#94A3B8]">中位维修时长(分钟)</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((item, index) => (
              <tr key={item.faultType} className="border-b border-[#1E3A5F]/50">
                <td className="px-3 py-2 text-[#FF6B35] font-semibold">{index + 1}</td>
                <td className="px-3 py-2 text-white">{item.faultType}</td>
                <td className="px-3 py-2 text-right text-white">{item.median}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
