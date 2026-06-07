import ReactECharts from 'echarts-for-react'
import type { ProductionLineComparison } from '@/types'

interface ProductionLineChartProps {
  data: ProductionLineComparison[]
}

export default function ProductionLineChart({ data }: ProductionLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
        <span className="text-lg text-[#95A5A6]">暂无数据</span>
      </div>
    )
  }

  const lineNames = data.map((d) => d.productionLine)
  const plannedData = data.map((d) => d.plannedMinutes)
  const unplannedData = data.map((d) => d.unplannedMinutes)
  const totalData = data.map((d) => d.plannedMinutes + d.unplannedMinutes)

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '产线停机对比',
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
      formatter: (params: unknown[]) => {
        const items = params as { seriesName: string; value: number; axisValue: string; dataIndex: number }[]
        const item = data[items[0]?.dataIndex]
        if (!item) return ''
        let html = `<div style="font-weight:600;margin-bottom:4px">${item.productionLine}</div>`
        html += `<div>计划停机: ${item.plannedMinutes} 分钟</div>`
        html += `<div>非计划停机: ${item.unplannedMinutes} 分钟</div>`
        html += `<div>合计: ${item.plannedMinutes + item.unplannedMinutes} 分钟</div>`
        const shiftEntries = Object.entries(item.breakdownByShift)
        if (shiftEntries.length > 0) {
          html += `<div style="margin-top:4px;font-weight:600">班次分布:</div>`
          shiftEntries.forEach(([shift, minutes]) => {
            html += `<div>&nbsp;&nbsp;${shift}: ${minutes} 分钟</div>`
          })
        }
        const faultEntries = Object.entries(item.breakdownByFaultType)
        if (faultEntries.length > 0) {
          html += `<div style="margin-top:4px;font-weight:600">故障类型分布:</div>`
          faultEntries.forEach(([fault, minutes]) => {
            html += `<div>&nbsp;&nbsp;${fault}: ${minutes} 分钟</div>`
          })
        }
        return html
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#94A3B8' },
      data: ['计划停机', '非计划停机'],
    },
    grid: { left: 80, right: 40, top: 50, bottom: 40 },
    xAxis: {
      type: 'value',
      name: '停机时长(分钟)',
      nameTextStyle: { color: '#94A3B8' },
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#1E3A5F' } },
    },
    yAxis: {
      type: 'category',
      data: lineNames,
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8' },
    },
    series: [
      {
        name: '计划停机',
        type: 'bar',
        stack: 'total',
        data: plannedData,
        itemStyle: { color: '#3498DB', borderRadius: [0, 0, 0, 0] },
        barWidth: '50%',
      },
      {
        name: '非计划停机',
        type: 'bar',
        stack: 'total',
        data: unplannedData,
        itemStyle: { color: '#E74C3C', borderRadius: [0, 4, 4, 0] },
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          formatter: (params: { dataIndex: number }) => `${totalData[params.dataIndex]}`,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
        },
      },
    ],
  }

  return (
    <div className="rounded-xl border border-[#1E3A5F] bg-[#0F1B2D] p-4">
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
