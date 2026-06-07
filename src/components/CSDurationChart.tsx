import { useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDashboardStore } from '@/store/dashboardStore'

interface CSDurationChartProps {
  height?: number
}

export default function CSDurationChart({ height = 360 }: CSDurationChartProps) {
  const csDuration = useDashboardStore((s) => s.csDuration)

  const getOption = useCallback(() => {
    if (csDuration.length === 0) return {}

    const total = csDuration.reduce((sum, s) => sum + s.value, 0)
    let cumulative = 0

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: { name: string; value: number; data: { isAnomaly: boolean } }[]) => {
          if (!params || params.length === 0) return ''
          const p = params[0]
          return `<b>${p.name}</b><br/>耗时: ${p.value}天<br/>占比: ${((p.value / total) * 100).toFixed(1)}%${p.data?.isAnomaly ? '<br/><span style="color:#ef4444">⚠ 异常环节</span>' : ''}`
        },
      },
      grid: { left: 80, right: 30, top: 30, bottom: 40 },
      xAxis: {
        type: 'category' as const,
        data: csDuration.map((s) => s.name),
        axisLabel: { fontSize: 11, color: '#64748b' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value' as const,
        name: '天',
        axisLabel: { fontSize: 11, color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'bar',
          stack: 'total',
          name: '辅助',
          data: csDuration.map(() => {
            const val = cumulative
            cumulative += csDuration[cumulative < csDuration.length ? 0 : 0]?.value || 0
            return val
          }),
          itemStyle: { color: 'transparent' },
          barWidth: '50%',
        },
        {
          type: 'bar',
          stack: 'total',
          name: '耗时',
          data: csDuration.map((s) => ({
            value: s.value,
            isAnomaly: s.isAnomaly,
            itemStyle: {
              color: s.isAnomaly ? '#ef4444' : '#10b981',
              borderRadius: s === csDuration[csDuration.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0],
            },
          })),
          label: {
            show: true,
            position: 'inside' as const,
            formatter: '{c}天',
            fontSize: 10,
            color: '#fff',
          },
          barWidth: '50%',
        },
      ],
    }
  }, [csDuration])

  if (csDuration.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无数据</div>
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">客服处理耗时分布</h3>
      <ReactECharts option={getOption()} style={{ height }} />
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> 正常
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> 异常
        </span>
      </div>
    </div>
  )
}
