import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { generateKPIData, generateReturnRateTrend } from '@/mock/data'
import { TrendingUp, TrendingDown } from 'lucide-react'
import EChartsWrapper from '@/components/EChartsWrapper'
import type { EChartsOption } from 'echarts'

const KPI_CARDS = [
  { key: 'returnRate' as const, label: '总退货率', border: 'border-l-accent-orange', format: (v: number) => `${v}%` },
  { key: 'refund' as const, label: '退款总额', border: 'border-l-accent-red', format: (v: number) => `$${v.toLocaleString()}` },
  { key: 'orders' as const, label: '退货订单数', border: 'border-l-accent-blue', format: (v: number) => v.toLocaleString() },
  { key: 'processing' as const, label: '平均处理天数', border: 'border-l-accent-green', format: (v: number) => `${v}天` },
]

function getKPIValues(kpi: ReturnType<typeof generateKPIData>) {
  return {
    returnRate: { value: kpi.totalReturnRate, trend: kpi.returnRateTrend },
    refund: { value: kpi.totalRefundUSD, trend: kpi.refundTrend },
    orders: { value: kpi.totalReturnOrders, trend: kpi.orderTrend },
    processing: { value: kpi.avgProcessingDays, trend: kpi.processingTrend },
  }
}

function TrendIndicator({ trend, inverse }: { trend: number; inverse?: boolean }) {
  const isUp = trend > 0
  const isBad = inverse ? !isUp : isUp
  const color = isBad ? 'text-accent-red' : 'text-accent-green'
  const Icon = isUp ? TrendingUp : TrendingDown
  return (
    <span className={`text-xs flex items-center gap-0.5 ${color}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(trend)}%
    </span>
  )
}

export default function Overview() {
  const warehouseType = useStore((s) => s.warehouseType)

  const kpi = useMemo(() => generateKPIData(warehouseType), [warehouseType])
  const trendData = useMemo(() => generateReturnRateTrend(), [warehouseType])

  const kpiValues = getKPIValues(kpi)

  const chartOption = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['海外仓', '国内仓', '整体'], top: 10 },
    grid: { left: 60, right: 30, top: 60, bottom: 30 },
    xAxis: { type: 'category', data: trendData.map((d) => d.date), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%', fontSize: 11 } },
    series: [
      {
        name: '海外仓',
        type: 'line',
        smooth: true,
        data: trendData.map((d) => d.overseasRate),
        itemStyle: { color: '#FF6B35' },
        areaStyle: { color: 'rgba(255,107,53,0.12)' },
      },
      {
        name: '国内仓',
        type: 'line',
        smooth: true,
        data: trendData.map((d) => d.domesticRate),
        itemStyle: { color: '#2ECB71' },
        areaStyle: { color: 'rgba(46,203,113,0.12)' },
      },
      {
        name: '整体',
        type: 'line',
        smooth: true,
        data: trendData.map((d) => d.overallRate),
        itemStyle: { color: '#3498DB' },
        areaStyle: { color: 'rgba(52,152,219,0.12)' },
      },
    ],
  }), [trendData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => {
          const { value, trend } = kpiValues[card.key]
          const inverse = card.key === 'processing'
          return (
            <div
              key={card.key}
              className={`bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border-l-4 ${card.border}`}
            >
              <span className="text-2xl font-bold font-display">{card.format(value)}</span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{card.label}</span>
                <TrendIndicator trend={trend} inverse={inverse} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <EChartsWrapper
          option={chartOption}
          style={{ height: '360px', width: '100%' }}
        />
      </div>
    </div>
  )
}
