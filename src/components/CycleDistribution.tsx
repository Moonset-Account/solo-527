import { useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDashboardStore } from '@/store/dashboardStore'

interface CycleDistributionProps {
  height?: number
}

export default function CycleDistribution({ height = 360 }: CycleDistributionProps) {
  const cycleDistribution = useDashboardStore((s) => s.cycleDistribution)
  const [viewMode, setViewMode] = useState<'distribution' | 'stages'>('distribution')

  const getDistributionOption = useCallback(() => {
    if (!cycleDistribution) return {}
    const { distribution } = cycleDistribution

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
      },
      grid: { left: 60, right: 20, top: 30, bottom: 40 },
      xAxis: {
        type: 'category' as const,
        data: distribution.map((d) => d.range),
        axisLabel: { fontSize: 11, color: '#64748b' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { fontSize: 11, color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'bar',
          data: distribution.map((d) => ({
            value: d.count,
            itemStyle: {
              color: d.isAnomaly ? '#ef4444' : '#10b981',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '50%',
          label: {
            show: true,
            position: 'top' as const,
            fontSize: 10,
            color: '#64748b',
          },
          markLine: {
            silent: true,
            data: [
              {
                type: 'average' as const,
                label: { formatter: '均值: {c}', fontSize: 10 },
                lineStyle: { color: '#f59e0b', type: 'dashed' as const },
              },
            ],
          },
        },
      ],
    }
  }, [cycleDistribution])

  const getStagesOption = useCallback(() => {
    if (!cycleDistribution) return {}
    const { stages } = cycleDistribution

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
      },
      legend: {
        data: ['平均', 'P50', 'P95'],
        top: 0,
        textStyle: { fontSize: 11, color: '#64748b' },
      },
      grid: { left: 80, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: stages.map((s) => s.name),
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
          name: '平均',
          type: 'bar',
          data: stages.map((s) => s.avg),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%',
        },
        {
          name: 'P50',
          type: 'bar',
          data: stages.map((s) => s.p50),
          itemStyle: { color: '#059669', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%',
        },
        {
          name: 'P95',
          type: 'bar',
          data: stages.map((s) => s.p95),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
          barWidth: '20%',
        },
      ],
    }
  }, [cycleDistribution])

  if (!cycleDistribution) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无数据</div>
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">退款周期分析</h3>
        <div className="flex rounded-md border border-slate-200 overflow-hidden">
          <button
            onClick={() => setViewMode('distribution')}
            className={`px-3 py-1 text-xs transition-colors ${
              viewMode === 'distribution' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            周期分布
          </button>
          <button
            onClick={() => setViewMode('stages')}
            className={`px-3 py-1 text-xs transition-colors ${
              viewMode === 'stages' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            环节耗时
          </button>
        </div>
      </div>
      <ReactECharts option={viewMode === 'distribution' ? getDistributionOption() : getStagesOption()} style={{ height }} />
    </div>
  )
}
