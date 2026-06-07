import { useEffect } from 'react'
import { AlertTriangle, Truck } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import CycleDistribution from '@/components/CycleDistribution'
import ReactECharts from 'echarts-for-react'

export default function CycleAnalysis() {
  const { cycleDistribution, samples, fetchCycleDistribution, fetchSamples } = useDashboardStore()

  useEffect(() => {
    fetchCycleDistribution()
    fetchSamples()
  }, [])

  const getLogisticsOption = () => {
    const logisticsNames = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '京东物流']
    const avgCycle = [4.2, 5.8, 6.1, 6.5, 4.8]
    const anomalyRate = [2.1, 4.3, 5.2, 6.8, 2.9]

    return {
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: { data: ['平均周期(天)', '异常率(%)'], top: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      grid: { left: 60, right: 60, top: 40, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: logisticsNames,
        axisLabel: { fontSize: 11, color: '#64748b' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: '天',
          axisLabel: { fontSize: 11, color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        {
          type: 'value' as const,
          name: '%',
          axisLabel: { fontSize: 11, color: '#64748b' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '平均周期(天)',
          type: 'bar',
          data: avgCycle,
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
          barWidth: '30%',
        },
        {
          name: '异常率(%)',
          type: 'line',
          yAxisIndex: 1,
          data: anomalyRate,
          itemStyle: { color: '#ef4444' },
          lineStyle: { color: '#ef4444' },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    }
  }

  const stages = cycleDistribution?.stages || []
  const anomalySamples = samples.filter((s) => s.isAnomaly)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">退款周期分布</h3>
        <CycleDistribution height={320} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {stage.name}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">平均</span>
                <span className="text-slate-800 font-medium">{stage.avg}天</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">P50</span>
                <span className="text-slate-800 font-medium">{stage.p50}天</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">P95</span>
                <span className="text-amber-600 font-medium">{stage.p95}天</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((stage.avg / stage.p95) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Truck size={14} className="text-slate-500" />
          物流商对比
        </h3>
        <ReactECharts option={getLogisticsOption()} style={{ height: 300 }} />
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            异常样本列表
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">订单号</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">商品</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">退货原因</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">退款周期(天)</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {anomalySamples.map((s) => (
                <tr key={s.orderId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700 font-mono text-xs">{s.orderId}</td>
                  <td className="px-4 py-2 text-slate-700">{s.product}</td>
                  <td className="px-4 py-2 text-slate-700">{s.reason}</td>
                  <td className="px-4 py-2 text-red-600 font-medium">{s.refundCycle}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 border border-red-200">
                      <AlertTriangle size={10} /> 异常
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
