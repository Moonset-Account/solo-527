import ReactECharts from 'echarts-for-react'
import type { ParetoItem } from '@/types'

interface ParetoChartProps {
  data: ParetoItem[]
}

export default function ParetoChart({ data }: ParetoChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
        <span className="text-lg text-[#95A5A6]">暂无数据</span>
      </div>
    )
  }

  const faultTypes = data.map((d) => d.faultType)
  const plannedData = data.map((d) => d.plannedMinutes)
  const unplannedData = data.map((d) => d.unplannedMinutes)
  const cumulativeData = data.map((d) => d.cumulativePercentage)

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '停机原因 Pareto 分析',
      left: 'left',
      top: 0,
      textStyle: { color: '#FFFFFF', fontSize: 16, fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: '#0F1B2D',
      borderColor: '#1E3A5F',
      textStyle: { color: '#FFFFFF' },
      formatter: (params: unknown[]) => {
        const items = params as { seriesName: string; value: number; axisValue: string }[]
        const planned = items.find((i) => i.seriesName === '计划停机')
        const unplanned = items.find((i) => i.seriesName === '非计划停机')
        const cumulative = items.find((i) => i.seriesName === '累计百分比')
        const plannedVal = planned?.value ?? 0
        const unplannedVal = unplanned?.value ?? 0
        const total = plannedVal + unplannedVal
        let html = `<div style="font-weight:600;margin-bottom:4px">${items[0]?.axisValue}</div>`
        html += `<div>计划停机: ${plannedVal} 分钟</div>`
        html += `<div>非计划停机: ${unplannedVal} 分钟</div>`
        html += `<div>合计: ${total} 分钟</div>`
        if (cumulative) {
          html += `<div>累计百分比: ${cumulative.value.toFixed(1)}%</div>`
        }
        return html
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#94A3B8' },
      data: ['计划停机', '非计划停机', '累计百分比'],
    },
    grid: { left: 60, right: 60, top: 50, bottom: 60 },
    xAxis: {
      type: 'category',
      data: faultTypes,
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8', rotate: 30, fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '停机时长(分钟)',
        nameTextStyle: { color: '#94A3B8' },
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#94A3B8' },
        splitLine: { lineStyle: { color: '#1E3A5F' } },
      },
      {
        type: 'value',
        name: '累计百分比(%)',
        nameTextStyle: { color: '#94A3B8' },
        max: 100,
        axisLine: { lineStyle: { color: '#1E3A5F' } },
        axisLabel: { color: '#94A3B8', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '计划停机',
        type: 'bar',
        stack: 'total',
        data: plannedData,
        itemStyle: { color: '#3498DB', borderRadius: [0, 0, 0, 0] },
        barWidth: '40%',
      },
      {
        name: '非计划停机',
        type: 'bar',
        stack: 'total',
        data: unplannedData,
        itemStyle: { color: '#E74C3C', borderRadius: [4, 4, 0, 0] },
        barWidth: '40%',
      },
      {
        name: '累计百分比',
        type: 'line',
        yAxisIndex: 1,
        data: cumulativeData,
        lineStyle: { color: '#FF6B35', type: 'dashed', width: 2 },
        itemStyle: { color: '#FF6B35' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }

  return (
    <div className="rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
