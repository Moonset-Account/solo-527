import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { useStore } from '@/store/useStore'
import { clickhouse } from '@/api/clickhouse'
import { supersetClient } from '@/api/superset'
import { pgMeta } from '@/api/postgresql'
import { AlertTriangle } from 'lucide-react'
import EChartsWrapper from '@/components/EChartsWrapper'
import ExportButton from '@/components/ExportButton'

const CONCLUSION_CONFIG: Record<string, { color: string; border: string; label: string }> = {
  warehouse_damage: { color: '#E74C3C', border: 'border-l-red-500', label: '仓库破损' },
  consumer_reason: { color: '#3498DB', border: 'border-l-blue-500', label: '消费者原因' },
  other: { color: '#95A5A6', border: 'border-l-gray-400', label: '其他' },
}

const CURRENCY_BADGE: Record<string, string> = {
  USD: 'bg-green-100 text-green-700',
  EUR: 'bg-blue-100 text-blue-700',
  GBP: 'bg-purple-100 text-purple-700',
  JPY: 'bg-red-100 text-red-700',
  AUD: 'bg-yellow-100 text-yellow-700',
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Quality() {
  const warehouseType = useStore((s) => s.warehouseType)

  const qualityThreshold = useMemo(
    () => pgMeta.getLowSampleConfig().find((c) => c.dimension === 'quality_conclusion')?.threshold ?? 20,
    []
  )

  const qualityData = useMemo(
    () => supersetClient.query(
      `quality_${warehouseType}`,
      () => clickhouse.getQualityDistribution(warehouseType, qualityThreshold)
    ),
    [warehouseType, qualityThreshold]
  )

  const refundData = useMemo(
    () => supersetClient.query(
      `refund_${warehouseType}`,
      () => clickhouse.getRefundReport(warehouseType)
    ),
    [warehouseType]
  )

  const totalCount = useMemo(() => qualityData.reduce((s, d) => s + d.count, 0), [qualityData])
  const totalConvertedUSD = useMemo(() => refundData.reduce((s, d) => s + d.convertedUSD, 0), [refundData])

  const filteredChartData = useMemo(() => qualityData.filter((d) => !d.isLowSample), [qualityData])

  const chartOption = useMemo<EChartsOption>(() => {
    const pieData = filteredChartData.map((d) => ({
      name: CONCLUSION_CONFIG[d.conclusion]?.label ?? d.conclusionLabel,
      value: d.count,
      itemStyle: { color: CONCLUSION_CONFIG[d.conclusion]?.color ?? '#999' },
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${totalCount.toLocaleString()}`,
          fontSize: 22,
          fontWeight: 'bold',
          fill: '#1F2937',
          textAlign: 'center',
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 12,
          },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: pieData,
        },
      ],
    }
  }, [filteredChartData, totalCount])

  const exportHeaders = ['币种', '原始金额', '汇率', '换算USD金额']
  const exportRows = useMemo(
    () => refundData.map((r) => [r.currency, r.originalAmount.toFixed(2), String(r.exchangeRate), r.convertedUSD.toFixed(2)]),
    [refundData]
  )

  const hasLowSample = qualityData.some((d) => d.isLowSample)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">质检结论分析</h1>
          <p className="mt-1 text-sm text-gray-500">
            仓库破损与消费者原因分层统计 | 低样本阈值: {qualityThreshold} 件 | 数据源: ClickHouse + PostgreSQL
          </p>
        </div>
      </div>

      {hasLowSample && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5">
          <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-700">
            部分质检结论样本量不足（&lt;{qualityThreshold}件），已从图表和排名中排除，仅显示提示
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <EChartsWrapper
            option={chartOption}
            style={{ height: 360 }}
          />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {qualityData.map((d) => {
            const cfg = CONCLUSION_CONFIG[d.conclusion]
            return (
              <div
                key={d.conclusion}
                className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${cfg.border} ${d.isLowSample ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                    {d.isLowSample && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                        <AlertTriangle size={10} />
                        样本不足
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    占比 {d.percentage}%
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {d.count.toLocaleString()}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">件</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">退款合计 (USD)</p>
                    <p className="text-lg font-semibold text-gray-800">
                      ${formatNumber(d.totalRefundUSD)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            退款金额报表（按币种换算为 USD）
          </h2>
          <ExportButton
            filename={`退款报表_${warehouseType}_${new Date().toISOString().slice(0, 10)}.csv`}
            headers={exportHeaders}
            rows={exportRows}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">币种</th>
                <th className="pb-3 font-medium text-right">原始金额</th>
                <th className="pb-3 font-medium text-right">汇率</th>
                <th className="pb-3 font-medium text-right">换算 USD 金额</th>
              </tr>
            </thead>
            <tbody>
              {refundData.map((r) => (
                <tr key={r.currency} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CURRENCY_BADGE[r.currency] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {r.currency}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-700">
                    {formatNumber(r.originalAmount)}
                  </td>
                  <td className="py-3 text-right text-gray-500">{r.exchangeRate}</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    ${formatNumber(r.convertedUSD)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="pt-3 font-semibold text-gray-900" colSpan={3}>
                  合计
                </td>
                <td className="pt-3 text-right font-bold text-gray-900">
                  ${formatNumber(totalConvertedUSD)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          汇率来源: PostgreSQL public.currency_exchange | 换算口径: {new Date().toISOString().slice(0, 10)} 生效汇率
        </div>
      </div>
    </div>
  )
}
